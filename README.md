# @origammi/agents-marketplace

Private marketplace of generic, context-aware AI agents for Origammi projects.

Agents are platform-agnostic in content — the same prompt works on Claude Code, Cursor, Codex, and Gemini. The CLI handles the format conversion.

## Plugins

| Plugin | Agents |
|--------|--------|
| `dev-team` | `designer`, `dev-team-backend`, `dev-team-frontend`, `dev-team-tester` |
| `product` | `pm`, `manager` |
| `security` | `red-team`, `blue-team` |
| `engineering` | `architect`, `devops`, `commit-and-pr-standards` |

---

## Setup

```bash
git clone git@github.com:origammi-digital/agents-marketplace.git ~/dev/origammi/agents-marketplace
cd ~/dev/origammi/agents-marketplace
npm install
npm link          # makes `agents` available globally
```

---

## Claude Code

Agents install into `~/.claude/skills/` and are invoked with `/agent-name` inside any Claude Code session.

```bash
# List all available agents (✓ = already installed)
agents list

# Install a full plugin
agents install dev-team
agents install security
agents install --all

# Install a single agent
agents install designer
agents install red-team

# Force-update already installed agents
agents install dev-team --force

# Remove an agent or plugin
agents uninstall designer
agents uninstall dev-team
```

After installing, **restart Claude Code**. Agents appear in the `/` menu.

---

## Cursor

Cursor reads rules from `.cursor/rules/*.mdc` inside the project repository. Export once per project, then commit the files.

```bash
# Inside your project repo
cd ~/dev/origammi/my-project

# Export a full plugin
agents export dev-team --platform cursor

# Export individual agents
agents export designer red-team --platform cursor

# Export everything
agents export --all --platform cursor
```

Generated files: `.cursor/rules/<agent-name>.mdc`

```bash
git add .cursor/rules/
git commit -m "chore: add Origammi agents as Cursor rules"
```

Cursor activates rules automatically when the project is open. Each rule shows up in the Cursor Rules panel. Set `alwaysApply: true` in the `.mdc` file to force-load a rule in every context.

---

## Codex (OpenAI)

Codex reads `AGENTS.md` from the repository root when running inside that directory.

```bash
cd ~/dev/origammi/my-project

agents export dev-team security --platform codex
# → writes AGENTS.md

git add AGENTS.md
git commit -m "chore: add Origammi agents for Codex"
```

Codex picks up `AGENTS.md` automatically. Each `## heading` becomes a named agent context.

To install globally (applies to all Codex sessions):

```bash
agents export --all --platform codex --output ~/.codex
```

---

## Gemini CLI

Gemini reads `GEMINI.md` from the project root (project-level) or `~/.gemini/GEMINI.md` (global).

**Project-level:**

```bash
cd ~/dev/origammi/my-project

agents export dev-team --platform gemini
# → writes GEMINI.md

git add GEMINI.md
git commit -m "chore: add Origammi agents for Gemini"
```

**Global (applies to all Gemini sessions):**

```bash
mkdir -p ~/.gemini
agents export --all --platform gemini --output ~/.gemini
```

---

## Adding a new agent

1. Create `plugins/<plugin>/<name>.md` with YAML frontmatter:

```markdown
---
name: <install-as-name>
description: One-line description shown in `agents list` and used as Cursor rule description.
---

# Agent Title

Agent prompt content here...
```

2. Add entry to `skills/catalog.json` under the relevant plugin:

```json
{
  "skill": "name",
  "installAs": "install-as-name",
  "description": "Short description",
  "file": "plugins/<plugin>/<name>.md",
  "tags": ["tag1", "tag2"]
}
```

3. Commit and push. Teammates update with:

```bash
git pull
agents install <name> --force
agents export <name> --platform cursor --force
```

---

## Product-specific agents

This repo contains **generic agents only**. Product-specific context (stack details, domain knowledge, compliance requirements) belongs in the project's own repository:

- **Claude Code**: add a `.claude/skills/` directory in the project repo, or use `CLAUDE.md` for always-on context
- **Cursor**: add extra `.cursor/rules/` files in the project repo
- **Codex**: extend `AGENTS.md` with project-specific sections
- **Gemini**: extend `GEMINI.md` with project-specific sections

Generic agents from this marketplace read context from the codebase and conversation — they don't need it hardcoded.
