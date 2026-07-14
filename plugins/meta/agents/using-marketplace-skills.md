---
name: using-marketplace-skills
description: Use at the start of any task to decide which marketplace skills apply and in what order — before writing code, exploring, or even asking clarifying questions. Establishes how to discover skills, the process-before-role priority, and the habit of announcing and checklisting a skill you invoke.
---

# Using the Marketplace Skills

You have a set of senior-grade skills installed. They only help if you reach for them *before* you start working, not after you've already guessed. This skill is how you decide which apply.

## The rule

**At the start of a task, check for a relevant skill before your first action** — before writing code, before exploring the codebase, before asking a clarifying question. If one plausibly applies, invoke it. If it turns out not to fit, you've lost nothing; drop it.

The check is cheap and the miss is expensive: the cost of skipping a skill isn't visible until you've already built the wrong thing or shipped the unverified fix.

## Two families, and the order between them

The skills come in two shapes, and process comes first:

1. **Process skills** (the `process` plugin: `planning-before-building`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`; plus `writing-skills`). These set *how the work is conducted*. They decide the approach.
2. **Role skills** (the senior personas: `architect`, `dev-team-backend`, `dev-team-frontend`, `designer`, `red-team`, `blue-team`, `devops`, `pm`, etc.). These carry out the work to a senior standard *within* that approach.

When both apply, the process skill sets the frame and the role skill fills it:

- "Build feature X" → `planning-before-building` to decompose, then `dev-team-backend`/`dev-team-frontend` to implement each step under `test-driven-development`.
- "Fix this bug" → `systematic-debugging` to find the root cause, then the relevant role skill to write the fix, then `verification-before-completion`.
- "Review this PR" → `architect` and, for anything security-sensitive, `red-team` + `blue-team` in parallel.
- "Author or edit a skill" → `writing-skills`.

## How to discover the right skill

Match on the *situation*, using each skill's description (they're written to say WHEN they apply, with trigger words):

- A bug, failure, or "it works sometimes" → `systematic-debugging`.
- About to write feature or fix code → `test-driven-development`.
- A multi-step or multi-file task with unknowns → `planning-before-building`.
- About to say "done" / commit / open a PR → `verification-before-completion`.
- A security concern, "is this safe?", auth, injection, a PR touching money or data → `red-team` + `blue-team`.
- Discovery, scoping, "what should we build?" → `pm`.

When several match, apply the process one first.

## When you invoke a skill

- **Say so.** State "Using [skill] to [purpose]" so the intent is explicit and you (and the user) can tell when you drift from it.
- **If it has a checklist or phased procedure, track it** — one item at a time, in order. Don't collapse the phases.
- **Follow it even under pressure.** The discipline skills exist precisely for the moment you're tempted to skip them. Deadline pressure is a reason to use them, not to drop them.

## Precedence

Explicit user instructions (and the project's CLAUDE.md/AGENTS.md) win over skills; skills win over your default behavior. Only skip a skill's workflow when the user has told you to.
