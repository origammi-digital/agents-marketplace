# @origammi/skills

Private Claude Code skills marketplace for Origammi projects.

## Install CLI

```bash
cd ~/dev/origammi/skills
npm install
npm link        # makes `skills` available globally
```

## Usage

```bash
# List all available skills (✓ = installed)
skills list

# Filter by category or tag
skills list --category aposent
skills list --tag security

# Install a specific skill
skills install red-team

# Install all universal skills
skills install --category universal

# Install a whole project squad
skills install --category aposent

# Force-update already installed skills
skills install --category universal --force

# Show skill details
skills info aposent-manager

# Remove a skill
skills uninstall red-team
```

## Structure

```
skills/
  catalog.json          # source of truth — all skill metadata
  universal/            # cross-project skills (security, arch, git)
  aposent/              # aposent.ai squad skills
  lumora/               # lumora squad skills
src/
  index.ts              # CLI
```

## Adding a new skill

1. Create `skills/<category>/<name>.md` with YAML frontmatter:

```markdown
---
name: my-skill
description: One-line description shown in `skills list`
---

# Skill prompt content here
```

2. Add entry to `skills/catalog.json`
3. Commit and push — teammates run `skills install <name> --force` to update

## Categories

| Category | Description |
|----------|-------------|
| `universal` | Works across all projects (security, arch, git standards) |
| `aposent` | aposent.ai squad (PM, design, backend, QA, legal) |
| `lumora` | lumora squad |
