---
name: systematic-debugging
description: Use when facing any bug, test failure, crash, or "it works sometimes" — before proposing or trying a fix. Especially when you've already tried one fix that didn't work, or you're tempted to guess. Covers reproduce → isolate → root cause → fix → verify, and the trap of patching symptoms.
---

# Systematic Debugging

A bug is a gap between what you believe the code does and what it actually does. You cannot close that gap by guessing — every guess that "should work" is a belief you haven't checked. This skill is the discipline of checking, in order, until the real cause is in your hands.

```
NO FIX WITHOUT A REPRODUCED FAILURE AND AN IDENTIFIED ROOT CAUSE FIRST.
```

## When to use

Use this the moment something misbehaves: a failing test, a crash, a wrong result, a flaky "sometimes." **Use it hardest under time pressure** — pressure is exactly when the urge to slap on a plausible fix is strongest, and a wrong fix costs more than the discipline would have.

Skip it only for a typo you can see with your eyes (wrong variable name on the line the error points to). Anything you'd have to *reason* about is a debugging task.

## The procedure

Each phase has an exit condition. Do not advance until it's met.

**Phase 1 — Reproduce.** Get the failure to happen on demand.
- Read the actual error — the full message and stack trace, not your memory of it.
- Find the smallest input/state that triggers it. A reliable repro is the single most valuable artifact in debugging; without it you can't tell a fix from a coincidence.
- Exit condition: you can make it fail whenever you want.

**Phase 2 — Isolate.** Narrow *where* the gap lives.
- What changed? Recent commits, config, data, dependency versions. `git log`/`git bisect` earn their keep here.
- Bisect the code path: add observation (logging, breakpoints, asserts) at the midpoint of the suspect flow. Does reality match belief there? Move up or down accordingly.
- Exit condition: you've localized the failure to a specific function/line/state transition.

**Phase 3 — Root cause.** Explain *why*, mechanically.
- State the cause as a causal chain: "X holds, so Y runs with Z, which produces the wrong W." No "probably", no "might be."
- Confirm it: you should be able to *predict* a second observation from your explanation and see it come true. An explanation that only fits what you've already seen is a hypothesis, not a root cause.
- Exit condition: you can explain every symptom, and you predicted something new that checked out.

**Phase 4 — Fix.** Change the cause, not the symptom.
- The fix targets the mechanism from Phase 3. If you're clamping an output, adding a retry, or special-casing an input, ask: am I treating the disease or the rash?
- Consider blast radius: does this cause hide elsewhere? Fix the class, not just the instance.

**Phase 5 — Verify.** Prove it with the Phase 1 repro.
- Run the exact reproduction. It must now pass.
- Run the surrounding tests — a fix that breaks two neighbors is not a fix.
- For an intermittent bug, run enough times that "passes once" isn't luck.

## The three-failed-fixes rule

If you've tried three fixes and the bug survives, **stop touching the code.** Three misses means your model of the system is wrong, not that you need a fourth patch. Return to Phase 1: your repro, your isolation, or your root cause is flawed. Re-examine the assumption you're most sure of — it's usually the wrong one.

## Rationalization table

| Thought | Reality |
|---|---|
| "I'm pretty sure it's the cache/race/config — let me just try that" | "Pretty sure" is a hypothesis. Trying it before Phase 3 is guessing with a compile step. Confirm the cause first. |
| "No time to reproduce, I'll just fix it" | Without a repro you can't tell a fix from a coincidence. You'll 'fix' it, ship it, and it comes back. Repro *is* the fast path. |
| "The stack trace is noise, I know this area" | Knowing the area is why you'll skim past the one frame that matters. Read it. |
| "It's flaky, nothing to reproduce" | Flaky means state/timing dependent, not unknowable. Find the condition; that condition IS the bug. |
| "Adding logging is slower than just trying a fix" | One round of observation beats five rounds of guess-and-rebuild. |

## Red flags — STOP

These phrases (yours or the user's) mean you've left the method — go back to Phase 1:
- "Let me just try changing…" (before a confirmed root cause)
- "It's probably the…" stated as if it were fact
- "That fix didn't work, let me try…" for the third time
- "Stop guessing" / "Why isn't this working" from the user — you skipped a phase
- Adding `try/catch`, retries, or `if (weird_case)` to make a symptom disappear

## Integration

- The fix you land is code — build it under `test-driven-development` (write the failing test that encodes the Phase 1 repro first).
- Before claiming the bug is dead, run `verification-before-completion`.
- For architectural root causes (the bug is a design smell, not a line), bring in `architect`.
