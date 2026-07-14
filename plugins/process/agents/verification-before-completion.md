---
name: verification-before-completion
description: Use before claiming any work is done, fixed, passing, or ready — before committing, opening a PR, or telling the user it works. When you're about to say "done" based on what the code should do rather than what you observed it do. Requires fresh evidence, not confidence.
---

# Verification Before Completion

"Done" is a claim about reality, and reality doesn't care how confident you are. The gap between "I wrote code that should work" and "I observed it work" is where broken merges, reopened bugs, and lost trust live. This skill closes that gap: you don't assert success, you *show* it.

```
NO COMPLETION CLAIM WITHOUT FRESH EVIDENCE THAT YOU JUST OBSERVED.
```

"Fresh" matters: a test you ran ten edits ago is not evidence about the code as it stands now.

## When to use

Before any of these words leave your mouth or your commit: *done, fixed, working, passing, ready, complete, should be good.* Before `git commit`, before opening a PR, before handing back to the user. **Use it especially when you're confident** — confidence is precisely the state in which people skip the check and ship the break.

## The method

**1 — Name the claim.** What exactly are you asserting? "The bug is fixed." "The feature works." "Tests pass." Each is checkable; make it explicit.

**2 — Exercise the real thing.** Run the code the way the claim implies — not a proxy for it.
- "Tests pass" → run the tests now, the full relevant set, and read the output.
- "The bug is fixed" → run the original reproduction and watch it not happen.
- "The feature works" → drive the actual flow end to end (the request, the UI path, the job), not just a unit test of one piece.
- "It builds" → run the build/typecheck now, on the current tree.

**3 — Read the evidence, don't glance at it.** Exit code 0 with a swallowed error is not success. A green suite that skipped the new test is not coverage. Look at what actually ran.

**4 — Check what you might have broken.** Run the neighbors. A change that fixes A and breaks B is not done. This is the step most often skipped.

**5 — State the result honestly.** If it passed, say so with the evidence ("ran the 14 auth tests, all green; reproduced the original 500 and it now returns 200"). If it failed or you couldn't verify, say *that* — a truthful "tests fail with X" is worth far more than a hopeful "should be working."

## The honesty clause

If you did not run it, you do not know it works — say "I haven't verified this yet," not "this should work." "Should work" is a prediction dressed as a report, and the reader can't tell the difference. Never launder confidence into a completion claim. A skipped step is disclosed, not hidden.

## Rationalization table

| Thought | Reality |
|---|---|
| "The change is trivial, it obviously works" | "Obvious" changes break builds constantly — a typo, a wrong import, an unhandled null. Trivial to write is not verified to run. |
| "I ran the tests earlier" | Earlier was a different tree. You've edited since. Evidence expires the moment you touch the code. |
| "The types check, so it works" | Types catch a class of errors, not logic bugs, not the runtime path. Green types ≠ correct behavior. |
| "I'll just say it should work" | The reader can't distinguish your "should" from a "did." That's how a false 'done' propagates. Verify or disclose. |
| "Verifying takes too long" | Re-opening the bug, the failed merge, and the user's lost trust take far longer. The check is the cheap part. |
| "The happy path works, good enough" | The claim was "works," not "works if nothing goes wrong." Check the failure the change was supposed to handle. |

## Red flags — STOP

- About to type "done" / "fixed" / "should work" without having run anything since your last edit.
- Committing or opening a PR without a fresh test/build run.
- "The logic is correct" as your evidence (that's reasoning, not observation).
- Reporting success from memory of an earlier run.
- Reading exit code 0 without reading the output above it.

## Integration

- The evidence for a bugfix is the `systematic-debugging` Phase 1 reproduction, now passing.
- The evidence for a feature is the `test-driven-development` suite plus an end-to-end exercise of the real flow.
- This is the last gate before `commit-and-pr-standards` (which additionally requires build + tests green before a commit) and `requesting-code-review`.
