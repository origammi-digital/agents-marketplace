# @origammi/agents-marketplace

Private marketplace of generic, senior-grade AI agents for Origammi projects.

Works with **Claude Code, Cursor, Codex, and Gemini**. Same agent content, adapted to each platform's format.

---

## Quickstart

```bash
git clone git@github.com:origammi-digital/agents-marketplace.git ~/dev/origammi/agents-marketplace
cd ~/dev/origammi/agents-marketplace
npm install && npm link
```

Then **ask your AI to install agents for you**:

> "List the available agent plugins and install the ones I need."

The AI reads `CLAUDE.md` / `AGENTS.md`, lists available plugins, asks your platform, and runs the installation.

---

## Plugins

| Plugin | Agents |
|--------|--------|
| `dev-team` | designer, backend, frontend, tester |
| `product` | pm, manager (squad orchestrator) |
| `security` | red-team, blue-team |
| `engineering` | architect, devops, observability, api-standards, commit-and-pr-standards |
| `llm-eval` | llm-eval (DeepEval-based behavioral testing) |
| `references` | ref-testing-frameworks, ref-performance-patterns |

**references** are on-demand skills invoked by other agents when they need detailed code patterns. Install them alongside the main plugins.

---

## Manual CLI reference

```bash
agents list                                           # list all agents with installed versions
agents list --updates                                 # show only agents with updates available
agents install dev-team                               # install plugin (Claude Code)
agents install dev-team references                    # install with reference skills
agents install --all                                  # install everything
agents install --update                               # update only agents with a newer version
agents install --force --all                          # force reinstall everything
agents info architect                                 # show version, installedAt, description
agents export dev-team --platform cursor              # Cursor (.cursor/rules/)
agents export dev-team --platform codex               # Codex (AGENTS.md)
agents export dev-team --platform gemini              # Gemini (GEMINI.md)
agents export --all --platform gemini --output ~/.gemini  # Gemini global
```

### Version status in `agents list`

```
✓ architect          2.0.0   up to date
↑ devops             1.0→2.0 update available — run: agents install --update
○ llm-eval           1.0.0   not installed
```

Each agent has a `version` field in `catalog.json`. When a skill is updated, its version is bumped and `agents list` shows `↑`. Run `agents install --update` to apply only the changes.

---

## Adding agents

Product-specific agents (stack context, domain knowledge) belong in each project's own `CLAUDE.md` or `.cursor/rules/` — not here. This repo is generic agents only.

To add a new generic agent: create `plugins/<plugin>/<name>.md`, add to `skills/catalog.json`, commit and push. Ask the AI in this repo to guide you through the process.
