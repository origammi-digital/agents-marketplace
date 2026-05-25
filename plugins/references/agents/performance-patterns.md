---
name: ref-performance-patterns
description: Reference: concrete code patterns for N+1 detection, unbounded queries, sequential vs parallel async, and partial failure consistency. Invoke when reviewing or fixing performance issues. Companion to architect and dev-team-backend.
---

# Reference: Performance Patterns

Concrete patterns for the most common production performance problems. See `architect` for the review process that flags these.

---

## N+1 Query Detection

Any DB query inside a loop is an N+1 candidate. If the list has 1,000 items, you make 1,001 queries.

**Pattern to find:**
Any `await`, `.find()`, `.get()`, or query call inside `for`, `forEach`, `map`, or `reduce`.

```typescript
// 🔴 N+1: one query per user = 1,001 queries for 1,000 users
for (const user of users) {
  user.accounts = await Account.findAll({ where: { userId: user.id } });
}

// ✅ Fix: single query + group in memory
const accounts = await Account.findAll({
  where: { userId: users.map(u => u.id) }
});
const byUserId = Map.groupBy(accounts, a => a.userId);
for (const user of users) {
  user.accounts = byUserId.get(user.id) ?? [];
}
```

```php
// 🔴 Laravel N+1
$clients = Client::all();
foreach ($clients as $client) {
    echo $client->processes->count(); // query per client
}

// ✅ Fix: eager load
$clients = Client::with('processes')->get();
foreach ($clients as $client) {
    echo $client->processes->count(); // no extra queries
}
```

```go
// 🔴 Go N+1
for _, userID := range userIDs {
    accounts, _ := repo.FindByUser(ctx, userID) // N queries
    result[userID] = accounts
}

// ✅ Fix: batch query
accounts, _ := repo.FindByUsers(ctx, userIDs) // 1 query
byUser := groupByUserID(accounts)
```

**Detecting in tests:**
```php
DB::enableQueryLog();
$this->getJson('/api/clients?per_page=50')->assertOk();
$count = count(DB::getQueryLog());
$this->assertLessThanOrEqual(5, $count, "Expected ≤5 queries, got {$count}");
```

---

## Unbounded Queries

`findAll()` or `SELECT *` without `LIMIT` on a table that grows with users means one slow user can take down the system.

```typescript
// 🔴 Unbounded: loads every row into memory
const allUsers = await User.findAll();

// ✅ Always paginate
const users = await User.findAll({ limit: 100, offset: page * 100 });
```

```sql
-- 🔴 No LIMIT
SELECT * FROM transactions WHERE user_id = 123;

-- ✅ Paginated
SELECT * FROM transactions WHERE user_id = 123
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

**Server-side enforcement:** clients must not be able to request unlimited results. The API layer enforces a maximum page size regardless of what `per_page` the client sends.

---

## Sequential vs Parallel Async

Independent async operations should run concurrently. Sequential means total time = sum of all operations; parallel means total time = slowest operation.

```typescript
// 🔴 Sequential: 300ms (100 + 100 + 100ms)
const profile = await fetchProfile(id);
const balance = await fetchBalance(id);
const transactions = await fetchTransactions(id);

// ✅ Parallel: 100ms (all run at once)
const [profile, balance, transactions] = await Promise.all([
  fetchProfile(id),
  fetchBalance(id),
  fetchTransactions(id),
]);
```

```go
// 🔴 Sequential
profile, _ := svc.FetchProfile(ctx, id)
balance, _ := svc.FetchBalance(ctx, id)

// ✅ Parallel with errgroup
g, ctx := errgroup.WithContext(ctx)
var profile Profile
var balance Balance

g.Go(func() error { profile, err = svc.FetchProfile(ctx, id); return err })
g.Go(func() error { balance, err = svc.FetchBalance(ctx, id); return err })

if err := g.Wait(); err != nil { return err }
```

**When NOT to parallelize:**
- Operations that depend on each other's output
- Writes that must be ordered for consistency
- When you hit rate limits on external APIs

---

## Partial Failure Consistency

Multi-step writes must be atomic. If step 3 fails, steps 1 and 2 must roll back — otherwise state is corrupted.

```typescript
// 🔴 No transaction: deduction succeeds, credit fails = money disappears
await deductBalance(fromAccount, amount);
await creditBalance(toAccount, amount);  // fails here

// ✅ Atomic: either both succeed or neither does
await db.transaction(async (tx) => {
  await deductBalance(fromAccount, amount, tx);
  await creditBalance(toAccount, amount, tx);
});
```

```php
// Laravel
DB::transaction(function () use ($from, $to, $amount) {
    $from->decrement('balance', $amount);
    $to->increment('balance', $amount);
    TransferLog::create([...]);
});
```

```go
// GORM
db.Transaction(func(tx *gorm.DB) error {
    if err := tx.Model(&from).Update("balance", gorm.Expr("balance - ?", amount)).Error; err != nil {
        return err
    }
    if err := tx.Model(&to).Update("balance", gorm.Expr("balance + ?", amount)).Error; err != nil {
        return err
    }
    return nil
})
```

---

## TOCTOU — Time of Check to Time of Use

Check and deduction must happen atomically. Without a lock, concurrent requests can both pass the check and both deduct, causing overdraft.

```sql
-- 🔴 TOCTOU: check then update in two separate operations
SELECT balance FROM accounts WHERE id = 123;  -- reads 100
-- another request reads 100 here too
UPDATE accounts SET balance = balance - 50 WHERE id = 123;  -- both updates run

-- ✅ Atomic update with guard condition
UPDATE accounts
SET balance = balance - 50
WHERE id = 123 AND balance >= 50;
-- Check rows affected: if 0, the balance was insufficient
```

```php
// Laravel — pessimistic lock
DB::transaction(function () use ($accountId, $amount) {
    $account = Account::where('id', $accountId)->lockForUpdate()->first();
    if ($account->balance < $amount) {
        throw new InsufficientBalanceException();
    }
    $account->decrement('balance', $amount);
});
```

---

## Memory: Streaming Large Datasets

Loading large result sets fully into memory causes OOM on large tables.

```typescript
// 🔴 Loads all 10M rows into memory
const allTransactions = await Transaction.findAll();
for (const tx of allTransactions) { process(tx); }

// ✅ Stream in chunks
let cursor = null;
do {
  const batch = await Transaction.findAll({
    where: cursor ? { id: { [Op.gt]: cursor } } : {},
    limit: 1000,
    order: [['id', 'ASC']],
  });
  for (const tx of batch) { process(tx); }
  cursor = batch.at(-1)?.id;
} while (batch.length === 1000);
```
