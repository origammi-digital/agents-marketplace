---
name: ref-testing-frameworks
description: Reference: test code patterns for PHPUnit (Laravel), Vitest + React Testing Library, Playwright (E2E), and Go (testify). Invoke when implementing or reviewing tests and you need concrete framework syntax. Companion to dev-team-tester.
---

# Reference: Testing Framework Patterns

Quick-reference code patterns for common testing stacks. See `dev-team-tester` for test strategy and TDD process.

---

## PHPUnit — Laravel

```php
// Feature test (HTTP layer)
public function test_creates_transfer_and_fires_event(): void
{
    Event::fake([TransferInitiated::class]);

    $this->actingAs($user)
         ->postJson('/api/transfers', ['amount' => 100, 'to_account' => $account->id])
         ->assertCreated()
         ->assertJsonFragment(['status' => 'pending']);

    Event::assertDispatched(TransferInitiated::class);
}

// Auth gate — unauthenticated
public function test_requires_authentication(): void
{
    $this->postJson('/api/transfers', [])->assertUnauthorized();
}

// Auth gate — wrong tenant/owner
public function test_cannot_access_other_users_transfer(): void
{
    $transfer = Transfer::factory()->for($otherUser)->create();

    $this->actingAs($user)
         ->getJson("/api/transfers/{$transfer->id}")
         ->assertForbidden();
}

// Unit test — domain logic
public function test_rejects_transfer_when_balance_insufficient(): void
{
    $account = Account::factory()->make(['balance' => 50]);

    $result = (new TransferPolicy)->canExecute($account, amount: 100);

    $this->assertFalse($result->allowed());
    $this->assertEquals('INSUFFICIENT_BALANCE', $result->reason());
}

// Database assertions
$this->assertDatabaseHas('transfers', [
    'from_account_id' => $account->id,
    'status' => 'completed',
]);
$this->assertDatabaseCount('transfer_logs', 1);
```

---

## Vitest + React Testing Library

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransferForm } from './TransferForm';

it('shows error when amount exceeds balance', async () => {
  render(<TransferForm balance={50} />);

  await userEvent.type(screen.getByLabelText(/amount/i), '100');
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));

  expect(screen.getByText(/insufficient balance/i)).toBeInTheDocument();
});

it('disables submit button while submitting', async () => {
  render(<TransferForm balance={200} onSubmit={vi.fn(() => new Promise(() => {}))} />);

  await userEvent.type(screen.getByLabelText(/amount/i), '50');
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));

  expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
});

// Async data loading
it('shows transfers after loading', async () => {
  render(<TransferList />);

  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  await screen.findByText('Transfer #123'); // waits for async render
});
```

---

## Playwright — E2E

```typescript
import { test, expect } from '@playwright/test';

test('user can submit a transfer', async ({ page }) => {
  await page.goto('/transfers/new');
  await page.fill('[name="amount"]', '50');
  await page.selectOption('[name="to_account"]', 'acc_456');
  await page.click('button[type="submit"]');

  await expect(page.getByText('Transfer submitted')).toBeVisible();
  await expect(page).toHaveURL(/\/transfers\/\w+/);
});

test('shows error for invalid amount', async ({ page }) => {
  await page.goto('/transfers/new');
  await page.fill('[name="amount"]', '-10');
  await page.click('button[type="submit"]');

  await expect(page.getByText(/must be greater than 0/i)).toBeVisible();
  await expect(page).toHaveURL('/transfers/new'); // stayed on page
});

// Auth: redirect when not logged in
test('redirects unauthenticated users', async ({ page }) => {
  await page.goto('/transfers');
  await expect(page).toHaveURL('/login');
});
```

---

## Go — testify

```go
import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestTransferService_Execute(t *testing.T) {
    t.Run("succeeds when balance is sufficient", func(t *testing.T) {
        repo := &mockTransferRepo{}
        svc := NewTransferService(repo)

        result, err := svc.Execute(ctx, Transfer{Amount: 50, AccountBalance: 100})

        require.NoError(t, err)
        assert.Equal(t, "pending", result.Status)
        assert.True(t, repo.saveCalled)
    })

    t.Run("returns ErrInsufficientBalance when balance too low", func(t *testing.T) {
        svc := NewTransferService(&mockTransferRepo{})

        _, err := svc.Execute(ctx, Transfer{Amount: 100, AccountBalance: 50})

        assert.ErrorIs(t, err, ErrInsufficientBalance)
    })
}

// Table-driven test for boundary conditions
func TestAmountValidation(t *testing.T) {
    tests := []struct {
        name    string
        amount  float64
        wantErr bool
    }{
        {"zero is invalid", 0, true},
        {"negative is invalid", -1, true},
        {"positive is valid", 0.01, false},
        {"max is valid", 999999.99, false},
    }

    for _, tc := range tests {
        t.Run(tc.name, func(t *testing.T) {
            err := validateAmount(tc.amount)
            if tc.wantErr {
                assert.Error(t, err)
            } else {
                assert.NoError(t, err)
            }
        })
    }
}
```

---

## pytest — Python

```python
import pytest
from unittest.mock import MagicMock, patch

def test_transfer_succeeds_with_sufficient_balance():
    repo = MagicMock()
    svc = TransferService(repo)

    result = svc.execute(amount=50, account_balance=100)

    assert result.status == "pending"
    repo.save.assert_called_once()

def test_transfer_raises_when_balance_insufficient():
    svc = TransferService(MagicMock())

    with pytest.raises(InsufficientBalanceError):
        svc.execute(amount=100, account_balance=50)

@pytest.mark.parametrize("amount,valid", [
    (0, False),
    (-1, False),
    (0.01, True),
    (999_999.99, True),
])
def test_amount_validation(amount, valid):
    if valid:
        assert validate_amount(amount) is None
    else:
        with pytest.raises(ValidationError):
            validate_amount(amount)
```
