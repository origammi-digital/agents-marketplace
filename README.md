# @origammi/agents-marketplace

Private marketplace of generic, context-aware AI agents for Origammi projects.

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

The AI reads this repo's `CLAUDE.md` / `AGENTS.md`, lists available plugins, asks your platform, and runs the installation.

---

## Plugins

| Plugin | Agents |
|--------|--------|
| `dev-team` | designer, backend, frontend, tester |
| `product` | pm, manager (squad orchestrator) |
| `security` | red-team, blue-team |
| `engineering` | architect, devops, commit-and-pr-standards |

---

## Manual CLI reference

```bash
agents list                                        # list all agents
agents install dev-team                            # Claude Code
agents export dev-team --platform cursor           # Cursor (.cursor/rules/)
agents export dev-team --platform codex            # Codex (AGENTS.md)
agents export dev-team --platform gemini           # Gemini (GEMINI.md)
agents export --all --platform gemini --output ~/.gemini  # Gemini global
```

---

## Adding agents

Product-specific agents (stack context, domain knowledge) belong in each project's own `CLAUDE.md` or `.cursor/rules/` — not here. This repo is generic agents only.

To add a new generic agent: create `plugins/<plugin>/<name>.md`, add to `skills/catalog.json`, commit and push. Ask the AI in this repo to guide you through the process.
