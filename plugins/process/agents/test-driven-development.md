---
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code. When you're tempted to "write it first and add tests after," or think the change is too small to test. Covers the red-green-refactor loop and why the test comes first, not after.
---

# Test-Driven Development

Writing the test first is not about testing — it's about *design under a contract you can't fudge*. A test written before the code forces you to state what "working" means before you're emotionally invested in the code you already wrote. A test written after tends to certify whatever the code happens to do, bugs included.

```
NO PRODUCTION CODE WITHOUT A FAILING TEST THAT DEMANDS IT.
```

This applies to features AND bugfixes. A bugfix's first step is a test that reproduces the bug (and therefore fails).

## When to use

Any change to behavior: a new feature, a bugfix, an edge case, a refactor that changes a contract. **Use it especially when the change feels too small to test** — small changes are where "I'll just tweak this" silently breaks a neighbor, and the test is what catches it.

Genuine exceptions (state them out loud when you take them): throwaway spikes you will delete, pure formatting/rename with no behavior change, and exploratory code you'll rewrite once you understand the problem.

## The loop: Red → Green → Refactor

**RED — write one failing test.**
- It describes ONE behavior in terms of observable outcome, not implementation.
- Run it. **Watch it fail, for the reason you expect.** A test that passes before you wrote the code tests nothing; a test that fails for the wrong reason (typo, import error) is lying to you.
- If it can't fail, it can't protect you.

**GREEN — write the minimum code to pass.**
- The least code that makes this test go green. Not the elegant general version — the minimum. Resist building for tests you haven't written.
- Run it. Green. If other tests broke, you've found a regression now instead of in production.

**REFACTOR — clean up with the test as a net.**
- Now improve names, remove duplication, extract functions — the tests stay green the whole time. This is where good design happens, safely.
- Then loop back to RED for the next behavior.

The loop is small on purpose: one behavior at a time. A day of TDD is dozens of tiny laps, not three giant ones.

## What a good test asserts

- An observable outcome (return value, state change, emitted event, error raised) — never a private implementation detail.
- One reason to fail. If a test can break for five reasons, its failure tells you nothing.
- The behavior at the boundary: empty, zero, negative, max, concurrent, absent. Bugs live at edges.

## Rationalization table

| Excuse | Reality |
|---|---|
| "I'll write the code first, tests after" | Tests-after certify the code you already wrote, bugs and all. You lose the design pressure and you never see the test fail, so you never know it works. |
| "This is too simple to need a test" | Simple code with no test is where regressions hide, because nobody's watching it. The test is cheap; the silent break is not. |
| "The test is obvious, I'll skip watching it fail" | A test you didn't watch fail may be asserting nothing (wrong path, always-true). Watching red is how you test the test. |
| "I'll write all the tests, then all the code" | That's not TDD, it's a spec you'll rationalize away when the code fights back. One test, one lap. |
| "Refactoring doesn't need tests, I'm not changing behavior" | "Not changing behavior" is a claim. The passing tests are the proof. Without them you're just hoping. |

## Red flags — STOP

- Writing implementation before a red test exists.
- A new test that passes on the first run (it isn't exercising your new code).
- Skipping the "watch it fail" step "to save time."
- Tests that assert on internals so they break on every refactor — brittle, and they punish the cleanup TDD is supposed to enable.
- "I'll add tests before I open the PR" — that's tests-after wearing a TDD badge.

## Integration

- For a bug, the RED test is the reproduction from `systematic-debugging` Phase 1.
- For concrete framework syntax (PHPUnit, Vitest, Playwright, Go testify, pytest), pull the `ref-testing-frameworks` companion.
- For test-case design, coverage gaps, and mutation/contract testing, the `dev-team-tester` role skill defines *what* to test; this skill governs the *order* you write it in.
- Before claiming done, run `verification-before-completion`.
