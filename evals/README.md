# Skill evals

Portable regression guards on the skill files, written in **Node** — the runtime this repo already requires (the `agents` CLI runs on it). No API key, no network, no extra dependencies, no build step. They run anywhere someone clones this repo, which is the whole point: a guard that only runs in one privileged environment doesn't guard anything.

Three checks, each guarding a failure mode this repo has actually hit or is structurally exposed to — no padding for the sake of a fuller-looking suite:

- **`every_skill_file_exists`** — the native restructure (`c3f2c6f`) moved skill files and left the catalog pointing at the old paths, which broke the CLI. This catches that class of drift.
- **`no_product_specific_leakage`** (`b2p`, `BACEN`, `logger.InfoS`, …) — the security skills came from a b2p fintech project; PR #1 stripped that context out. Nothing else stops a future edit from pasting it back, so this locks the cleanup in.
- **`no_raw_tool_names_in_bodies`** (`TodoWrite`, `AskUserQuestion`) — `writing-skills` requires naming the action, not the tool, so bodies survive `agents export` to Cursor/Codex/Gemini. Cheap to guard.

(Softer checks — trigger-word heuristics, empty-description, name/installAs match — were dropped on purpose: they were closer to theater than protection.)

Run it:

```bash
npm test                          # wired into the repo's test script
# or directly:
node evals/skill-hygiene.mjs
```

Exit code is non-zero on any failure, so it works as a CI gate.

## Adding a check

Add an entry to the `checks` object in `skill-hygiene.mjs` that reads skills via `allSkills()` and throws on a violated invariant. Keep it dependency-free so it stays runnable everywhere.

## Behavioral evals — deliberately not shipped as code

Whether a skill actually *changes model behavior under pressure* can only be checked by running an LLM, which needs an API key, network, and paid calls — absent in most environments that clone this repo. Shipping that as a test would be dead weight that reads as coverage without providing it.

The method still lives where it belongs: the `writing-skills` meta skill documents how to validate a skill by comparing a pressure scenario **without** the skill (baseline) against **with** it (treatment), and the `llm-eval` skill provides the DeepEval patterns for anyone with a key. The everyday, everywhere guard is the offline suite above.
