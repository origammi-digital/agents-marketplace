---
name: writing-skills
description: Use when creating, editing, or reviewing a skill in this marketplace — authoring a new agent, rewriting an existing one, or deciding why a skill "isn't being used." Covers the two skill shapes (role vs process), the description-is-a-trigger rule, rationalization tables, positive-recipe wording, multi-platform action language, and how to test a skill before shipping it.
---

# Writing Skills for this Marketplace

You are editing the thing that edits everything else. A skill is a prompt that ships to Claude Code, Cursor, Codex, and Gemini and steers real work in other people's projects. A vague skill doesn't fail loudly — it quietly gets ignored, or worse, gets half-followed. This skill is how you make one that actually lands.

**Core principle:** a skill is not documentation about a role. It is an *instruction that has to win against the model's default behavior under pressure*. Write for the moment the model is tempted to skip it.

---

## Before you write: which shape is this?

This marketplace has two kinds of skills. They are written differently. Decide first.

| | **Role skill** (persona) | **Process skill** (discipline/workflow) |
|---|---|---|
| Examples | `backend`, `red-team`, `architect`, `designer` | (the `process` plugin: debugging, TDD, verification) |
| Answers | *Who is doing the work and to what standard* | *How the work is conducted, step by step* |
| Body is | Identity + expertise + operating modes + checklists | A procedure with an Iron Law, ordered phases, and gates |
| Fails when | It lists qualities but never a procedure — a quality bar with no method | It describes a good outcome but doesn't force the steps under pressure |
| Enforcement | Description triggers + "read context first" discipline | Rationalization tables + red flags + announce-and-checklist |

If you're writing a role skill, your risk is being *inert* (all adjectives, no verbs). If you're writing a process skill, your risk is being *skippable* (the model rationalizes its way past you). The rest of this skill fixes both.

---

## The description is a trigger, not a summary

This is the single highest-leverage rule, and it is counterintuitive.

**The `description` field decides two things:** (1) whether the model reaches for the skill at all, and (2) — dangerously — what the model thinks the skill *is* without opening it. Models routinely act on the description alone. So:

- **Say WHEN to use it, never WHAT it does.** A description that summarizes the workflow invites the model to follow the summary and skip the body. If the body says "review twice" and the description says "reviews code," the model does one review and moves on.
- **Start with "Use when…" / "Activate when…"**, third person, and pack in *triggers*: symptoms, user phrasings, error messages, synonyms, keywords. `red-team`'s description listing `"OWASP"`, `"injection"`, `"is this safe?"` is the model right here — those are retrieval hooks.
- **Include the anti-trigger when it matters** ("…not for X"). Skills fire on false positives too.
- Keep it under ~500 characters. It's an index entry, not a spec.

> Litmus test: if someone read only your description, would they *invoke* the skill at the right moment — and would they still feel the need to *open* it? If the description already tells them what to do, the body is dead weight and will be skipped.

---

## Role-skill skeleton

Follow the shape the existing role skills already use — consistency across the 16 is a feature:

1. **Frontmatter** — `name` + `description` (trigger-style, above).
2. **Identity** — "You are a senior X with N years in…". One paragraph. Then a **stack- and domain-agnostic clause**: *read the project context first, never assume the stack or domain.* (See the security skills' opening lines — this clause is now house style.)
3. **Identity & Expertise** — 4–6 bullets that each carry a *judgment*, not a credential. "Weight findings by real-world blast radius, not CWE popularity" teaches; "10 years of experience" doesn't.
4. **Operating Modes** — the engine of a role skill. Each mode is triggered by a situation (a PR shared, a threat-model request) and contains **numbered steps**. This is what turns a persona into a procedure. A role skill without modes is the weak kind — see "Common failures."
5. **Checklists** — concrete, verifiable line items. Mark conditional sections explicitly (e.g. `**(high-value asset systems)**`) so they're skipped when irrelevant instead of misapplied.
6. **Behavior Rules** — the non-negotiables, numbered, written for the person doing the work.

---

## Process-skill skeleton

Process skills exist to survive pressure — the deadline, the "this one's obvious," the third failed fix. They need teeth role skills don't:

1. **Frontmatter** — trigger description, emphasizing the *symptom* ("Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes").
2. **The Iron Law** — one line, in a code block, at the top. `NO FIX WITHOUT REPRODUCING THE BUG FIRST`. It's the thing you point back to when rationalization starts.
3. **When to use / when NOT to use** — with the counterintuitive line: *use this ESPECIALLY when under time pressure*, because pressure is exactly when the discipline gets dropped.
4. **The procedure** — numbered phases, each with concrete sub-steps and an observable exit condition. Phase N can't start until Phase N-1's evidence exists.
5. **Rationalization table** — see below. This is the load-bearing wall of a process skill.
6. **Red Flags — STOP** — a list of *verbal* tells ("just try changing X", "it's probably the cache", "let me skip the test just this once") that mean the discipline is slipping. Map each to the corrective action.
7. **Integration** — name the next skill explicitly (see "Chaining").

---

## Rationalization tables (the anti-skip mechanism)

Every process skill and every strict role rule should anticipate the excuse the model will make to skip it, and rebut it in place. Two columns: the thought, and the reality that dismantles it.

| Rationalization | Reality |
|---|---|
| "This bug is obvious, I don't need to reproduce it" | Obvious causes are wrong often enough that skipping repro is how you fix the wrong thing. Reproduce. |
| "The description already told me what to do" | The description is an index entry. The steps are in the body. Open it. |
| "Following the spirit is enough here" | Violating the letter of the rule is violating the spirit. There's no version where you skip the step and kept the discipline. |

Two rules for building these:
- **Derive them from real failures, not imagination.** The honest way to find the excuses is to run the scenario *without* the skill and write down verbatim what the model actually said to justify cutting the corner (see "Test it"). A table of made-up excuses misses the real ones.
- **Close the "spirit vs letter" loophole early.** Add the line *"violating the letter is violating the spirit"* near the top. It kills the entire class of "I'm technically honoring the intent" rationalizations at once.

---

## Match the form to the failure

Not every problem takes the same fix. Choose the wording form by the *kind* of failure:

- **Discipline failure** (the model knows the rule and breaks it under pressure) → prohibition + Iron Law + rationalization table. "NEVER claim done without running it." This is what "don't" is *for*.
- **Format failure** (the model produces the wrong *shape* of output) → a **positive recipe**, never a prohibition. Counterintuitively, "don't include a preamble" tends to *increase* preambles — the instruction plants the very token it forbids. Instead specify what the output *is*: "The output is: the diff, then a one-line summary, nothing before the diff." Describe the target, don't name the ghost.
- **Knowledge gap** (the model just doesn't know the pattern) → a reference example, ideally one excellent one. One great before/after beats five mediocre snippets in five languages.

Exception clauses don't scope. "This doesn't apply inside code blocks" still suppresses code blocks — the model reads the noun, not the logic. If you need to scope, restructure the instruction, don't bolt on an exception.

---

## Write for every platform: name actions, not tools

Skills in this repo export to Cursor, Codex, and Gemini via `agents export`. A body that says `use the Task tool` breaks everywhere but Claude Code. So:

- **Name the action, not the tool.** Write "dispatch a subagent", "ask the user to choose", "record a todo" — not `Task`, `AskUserQuestion`, `TodoWrite`. The action survives translation; the tool name doesn't.
- Keep platform-specific mechanics out of the skill body. If a skill genuinely needs a per-harness detail, that belongs in a companion reference file, not inline.
- Don't rely on emoji as a machine contract. `🔴/🟠` severity reads fine in Claude Code but degrades in a plaintext `AGENTS.md` export — always pair the emoji with a word (`🔴 CRITICAL`), never the emoji alone.

---

## Chaining skills

Skills compose into workflows. Make the seams explicit:

- **Name the next skill by name**, in an "Integration" or closing section: "After this, the only skill you invoke is `writing-plans`." Ambiguity is where the chain breaks.
- **Reference by skill name, never by file path.** Don't paste `@plugins/foo/bar.md` — that force-loads the whole file into context immediately, burning tokens before the skill is even needed. Say the name; let the model fetch it when it gets there.
- **Declare hard dependencies in `catalog.json`**, not just in prose. If skill A can't do its job without B's patterns, add B to A's `dependencies` (or `isReference` companion). The CLI resolves them on install so the user never has a dangling reference. Prose that says "see the architect skill" is a broken link if `architect` isn't installed.

---

## Test it before you ship it

We ship the only marketplace that also ships an eval engine (`llm-eval`). Use it on ourselves. Treat authoring a skill like TDD:

1. **RED — establish the baseline.** Run the target scenario against a subagent *without* the skill, several times. Record what it does wrong and the exact words it uses to justify it. If the baseline already behaves correctly, there's nothing to fix — stop and don't add the skill.
2. **GREEN — write the minimum** that targets those specific failures and rationalizations. Not a general essay; a rebuttal to what you actually observed.
3. **REFACTOR — probe for new holes.** Re-run under harder pressure, find the next rationalization, add the next counter, repeat until it holds.

Wording micro-tests: change one sentence, run it 5+ times against fresh context, always with a no-guidance control. **Treat variance as a signal** — if five runs interpret your instruction five different ways, the wording isn't binding yet. Read every run by hand; don't trust an aggregate.

The `llm-eval` skill is how you turn this into a repeatable suite (groundedness, behavioral assertions, regression on prompt edits). A skill that changed behavior in a test is a skill you can trust; one that only reads well is a hypothesis.

---

## Marketplace mechanics (don't forget the plumbing)

A skill isn't shipped until the catalog knows about it:

1. Create `plugins/<plugin>/<name>.md` with the frontmatter above.
2. Add an entry to `skills/catalog.json` under the right plugin: `skill`, `installAs`, `version` (start at `1.0.0`), `description`, `file`, `tags`, and `dependencies`/`isReference` if any.
3. **On every edit to an existing skill, bump its `version` in the catalog** — patch for fixes, minor for new sections, major for a rewrite. If you don't, `agents list` shows `✓` to users on the old version and they never learn to update. The content change is invisible without the bump.
4. Keep the description in the catalog and the description in the frontmatter in sync — both are read, in different places.

---

## Common failures

- **The inert role skill.** All identity and adjectives, no operating modes, no numbered procedure. It tells the model to *be* excellent without telling it what to *do*. Fix: add modes with steps. (Historically our weakest skills were the ones that were only "principles + checklist.")
- **The description that leaks the body.** Summarizes the workflow, so the model follows the summary and skips the skill. Fix: rewrite as a pure "Use when…" trigger.
- **Prohibition used for a format problem.** "Don't add commentary" that produces more commentary. Fix: positive recipe.
- **Imagined rationalizations.** A rebuttal table written from a chair instead of from a baseline run. It rebuts excuses the model never makes and misses the ones it does. Fix: run the baseline first.
- **Tool names in the body.** `TodoWrite`, `Task` — breaks on export. Fix: name the action.
- **Multi-language dilution.** The same example in five stacks, none of them sharp. Fix: one excellent example.
- **Silent version.** Edited the `.md`, forgot the catalog bump. Fix: bump every time.

---

## Naming

Verb-first or gerund for process skills (`systematic-debugging`, `verification-before-completion`), role noun for personas (`architect`, `red-team`). The name is a promise about when the skill applies — make it describe the *situation*, not an abstract topic (`condition-based-waiting` over `async-helpers`).
