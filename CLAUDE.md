# Origammi Agents Marketplace

This is a private marketplace of generic, senior-grade AI agents for Origammi projects.

## Your role when someone opens this project

1. Read `skills/catalog.json` to get the live list of plugins and agents.
2. Present the available plugins clearly to the user.
3. Ask which plugins they want and for which platform.
4. Run the installation commands on their behalf.

Do this proactively — don't wait to be asked.

---

## Installation commands

Check if `agents` CLI is available (`which agents`). If not, use `npx tsx src/index.ts` instead.

```bash
# List all plugins and agents (shows installed status for Claude Code)
agents list

# Install for Claude Code (~/.claude/skills/)
agents install <plugin-or-agent>        # e.g. agents install dev-team
agents install --all                    # install everything

# Export for other platforms (run inside the user's project directory)
agents export <targets> --platform cursor    # → .cursor/rules/*.mdc
agents export <targets> --platform codex     # → AGENTS.md
agents export <targets> --platform gemini    # → GEMINI.md

# Global Gemini install
agents export --all --platform gemini --output ~/.gemini
```

---

## Onboarding flow

When the user doesn't specify what they want, follow this flow:

**Step 1 — Ask platform**
> "Which AI tool are you setting up agents for? Claude Code, Cursor, Codex, or Gemini?"

**Step 2 — Read catalog and list plugins**
Read `skills/catalog.json`, then present:
```
Available plugins:
  dev-team    — designer, backend engineer, frontend engineer, QA/tester
  product     — product manager, squad orchestrator
  security    — red-team (offensive), blue-team (defensive)
  engineering — architect, devops, observability, api-standards, git/CI standards

Which plugins do you want? (you can pick multiple, or say "all")
```

**Step 3 — Install**
Run the appropriate command for their platform. For Cursor/Codex/Gemini, ask for the project directory path first if they want project-level installation.

**Step 4 — Confirm**
Show what was installed. For Claude Code, remind them to restart.

---

## Plugin overview

### dev-team
Generic senior engineers — stack-agnostic, reads the project stack before writing code.
- `designer` — UX discussion, screen review, implementation in project's stack. Knows when to push back on scope.
- `dev-team-backend` — layered architecture, TDD-first, idempotency-aware, observability-first. Reads the project stack before coding.
- `dev-team-frontend` — React + TypeScript primary, accessibility-first, security-aware, error boundaries.
- `dev-team-tester` — TDD lead: defines test cases before implementation, mutation testing, contract testing.

### product
- `pm` — JTBD discovery framework, Given/When/Then acceptance criteria, scope protection.
- `manager` — squad orchestrator: routes requests, enforces quality gates, never implements.

### security
Both agents gate before every merge — run them in parallel.
- `red-team` — adversary simulation, kill chain analysis, exploitation paths, prompt injection threat modeling.
- `blue-team` — detection engineering, audit trail completeness, IR readiness, LLM injection monitoring.

### engineering
- `architect` — code review, architecture decisions, distributed systems patterns, performance.
- `devops` — CI/CD optimization, container/K8s operations, infra incidents, cost analysis.
- `observability` — SLOs, error budgets, structured logging, alerting strategy, OpenTelemetry.
- `api-standards` — REST conventions, versioning, pagination, idempotency, error response format.
- `commit-and-pr-standards` — Conventional Commits, small commits, branch hygiene, auto-open PRs.

---

## Adding a new agent

If the user wants to create a new agent:

1. Ask: what role, what plugin category, what should the agent do?
2. Create `plugins/<plugin>/<name>.md` with this frontmatter:
   ```
   ---
   name: <install-as-name>
   description: One-line description used in listings and Cursor rule panels.
   ---
   ```
3. Add to `skills/catalog.json` under the correct plugin.
4. Commit and push.

The agent content should be written as a role prompt — what the agent IS, what it does, what it won't do. Context about the specific project goes in the project's own CLAUDE.md/AGENTS.md, not here.

Agents in this marketplace are **generic** — no product-specific context, no hardcoded paths or stack assumptions. Product-specific context belongs in the project's CLAUDE.md.
