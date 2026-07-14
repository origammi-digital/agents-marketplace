---
name: planning-before-building
description: Use when a task is multi-step, spans more than one file or system, or has any unknowns — before writing code. When you're tempted to "just start coding" a feature whose shape isn't fully clear. Turns a fuzzy request into a decomposed, reviewable plan of bite-sized steps.
---

# Planning Before Building

Code is the most expensive place to think. Every unknown you carry into the implementation gets resolved in the slowest, hardest-to-change medium there is. Planning is moving that thinking upstream — into text, where a wrong decision costs a sentence, not a refactor.

```
NO IMPLEMENTATION OF A MULTI-STEP TASK WITHOUT A WRITTEN, DECOMPOSED PLAN FIRST.
```

## When to use

Use this when the task touches more than one file or component, has unknowns (an unfamiliar API, an unclear requirement, a "how should this behave when…"), or would take more than a short sitting. **Use it especially when you feel ready to start coding immediately** — that confidence usually means you've collapsed several unexamined decisions into one, and the plan is where you'd have caught the bad one.

Skip it for genuinely single-step changes (one function, obvious edit). If you can't describe the change in one sentence without an "and," it's multi-step.

## The method

**1 — Restate the goal and the done-condition.** In your words: what does the user actually need, and how will we know it's achieved? If you can't state the done-condition, you're not ready to plan — clarify first (this is where `brainstorming` or the `pm` skill belongs).

**2 — Map the terrain before deciding.** Read the relevant code. What exists, what patterns are in use, what will this touch? A plan written without reading the code is fiction. List the files/interfaces involved.

**3 — Surface the unknowns and decide them now.** Every "we'll figure that out later" is a risk. Name them. For each real fork, pick an approach and say why in one line. Unresolved unknowns are the #1 cause of plans that fall apart mid-build.

**4 — Decompose into bite-sized steps.** Each step is:
- One coherent change with a clear outcome, small enough to hold in your head.
- Independently verifiable — you can tell when it's done and right.
- Ordered so each builds on the last; dependencies flow downward.
- Written for someone with zero context: which files, what change, how to verify. No "handle the edge cases" — say *which* edge cases.

**5 — Self-review the plan before executing.** Read it as an adversary:
- Placeholders? ("etc.", "and so on", "handle errors") — replace with specifics.
- Ordering: does any step need something a later step produces?
- Scope: is anything here not actually required? Cut it.
- Ambiguity: could two people read a step and build different things?

**6 — Get sign-off if the stakes warrant it**, then execute step by step — not all at once.

## What "bite-sized" means

Too big: "Build the authentication system." Right-sized: "Add a `verifyToken(token)` function in `auth.ts` that returns the decoded claims or throws `InvalidToken`; test valid, expired, and tampered tokens." A step you could hand to someone else and they'd build the same thing you would.

## Rationalization table

| Thought | Reality |
|---|---|
| "I understand it well enough, planning is overhead" | The parts you understand aren't the risk. The plan exists to expose the parts you've silently assumed. Overhead is the refactor when one of those assumptions was wrong. |
| "I'll plan as I code, it's more agile" | Planning-as-you-code means discovering the architecture-breaking unknown after you've built around it. Agile is short laps, not no map. |
| "The task is clear" | If it's clear, the plan takes five minutes and confirms it. If writing it isn't quick, it wasn't clear. |
| "A plan will just be wrong once I start" | A plan that changes on contact taught you something cheaply. That's the point, not a failure. |
| "Decomposing is busywork, I'll keep it in my head" | Held in your head, steps blur, get reordered, and get skipped under pressure. Written down, they're a checklist that survives interruption and compaction. |

## Red flags — STOP

- Opening an editor to write feature code with no written plan for a multi-file task.
- A plan step you can't state a verification for.
- "Handle the rest of the cases" / "wire everything up" as a step — that's a category, not a step.
- Starting step 1 while steps 3–5 are still "TBD."

## Integration

- If the *requirements* are fuzzy (not just the implementation), refine them first with `brainstorming` or the `pm` skill — plan a problem you actually understand.
- For design/architecture trade-offs inside the plan, consult `architect`.
- Execute each step under `test-driven-development`.
- Close out the whole plan with `verification-before-completion` before calling it done.
