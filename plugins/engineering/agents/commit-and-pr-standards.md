---
name: commit-and-pr-standards
description: Git discipline: Conventional Commits format, small focused commits, branch from up-to-date main, verify PR status before push, open PR automatically, English only for commits/PRs/comments, build + tests must pass before commit. Activate when creating commits, opening branches, writing PRs, or asking about git workflow.
---

# Commit and PR Standards

Apply these rules when creating commits, opening branches, writing PRs, and code comments.

---

## 1. Before Committing: Build + Tests — MANDATORY

> **STOP. Do not `git commit` until both the build AND tests pass.**

- **Run the build**: `npm run build` / `pnpm build` / `go build ./...` / `php artisan` / equivalent. A passing test suite does not mean the build passes — TypeScript errors, missing imports, and compile failures only surface at build time.
- **Run the tests**: `npm test` / `go test ./...` / `php artisan test` / equivalent.
- **Both must pass.** Fix failures before committing. Never commit a broken build — it blocks the whole team.
- To find the right commands: check `package.json` scripts, `Makefile`, or existing CI workflow files (`.github/workflows/`).

---

## 2. Conventional Commits Format

Every commit message must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

**Types:**

| Type | When to use |
|------|------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `chore` | Maintenance, dependency update, config change (no production logic change) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `perf` | Performance improvement |
| `ci` | CI/CD pipeline changes |
| `build` | Build system or tooling changes |
| `revert` | Reverts a previous commit |

**Rules:**
- Short description in lowercase, imperative mood, no period at end
- Scope is optional but helpful: `fix(auth): reject expired tokens` not `fix: auth tokens`
- Breaking changes: append `!` after type/scope — `feat(api)!: rename /users to /accounts`
- Body: wrap at 72 chars, explain WHY (not what — the diff shows that)

**Examples:**
```
feat(billing): add Stripe webhook for payment confirmation
fix(auth): reject tokens signed with alg:none
chore(deps): upgrade Laravel to 11.x
refactor(transfer): extract balance check into domain service
test(api): add coverage for concurrent transfer edge case
perf(dashboard): replace N+1 client query with eager load
ci: cache composer dependencies between workflow runs
```

---

## 3. Keep Commits Small

- **One logical change per commit.** Prefer several small commits over one large commit.
- Each commit should be self-contained: if reverted, it undoes exactly one logical change.
- If a change does multiple things (refactor + new feature), split into separate commits.
- Small commits make review, bisect, and revert easier.

---

## 4. After Committing: Push When Done

When all commits for the task are finished, push:
```bash
git push origin <branch>
```

Do not leave the user to push manually. Include push as part of the workflow when commits are complete.

---

## 5. Branching Strategy

New branches must be based on `main` (or `master`, whichever is the default):

```bash
git checkout main
git pull origin main
git checkout -b <type>/<short-description>
```

Branch naming convention:
- `feat/<short-description>` — new feature
- `fix/<short-description>` — bug fix
- `chore/<short-description>` — maintenance
- `refactor/<short-description>` — refactor
- `test/<short-description>` — test additions

Never open a PR from a branch based on an outdated or unrelated branch.

---

## 6. Before Pushing to an Existing Branch — STOP

> **STOP. Verify the PR is still open before pushing.**

```bash
gh pr list --head <current-branch> --state all
```

- PR **open**: push normally.
- PR **merged or closed**: do NOT push. Create a new branch from up-to-date main and open a new PR for the new changes.

Pushing to a merged branch orphans commits and creates confusion in history.

---

## 7. Opening Pull Requests

After pushing, open the PR automatically (`gh pr create`). Do not leave the user to open it manually.

**PR title:** follow Conventional Commits format:
```
feat(billing): add Stripe webhook for payment confirmation
```

**PR body template:**
```markdown
## What
<1-3 bullet points describing the change>

## Why
<The problem this solves, or the requirement driving this>

## How to test
- [ ] <step to verify the happy path>
- [ ] <step to verify the main error path>
- [ ] <any special setup required>
```

---

## 8. Comments: Minimal and Meaningful

- **Prefer no comments** when the code is clear.
- **Add comments only for:**
  - Non-obvious architectural decisions
  - Complex business rules or algorithms
  - Workarounds with a brief reason ("avoids Laravel queue bug in PHP 8.3 < 8.3.2")
- Never comment what the code does — the code does that. Comment why when non-obvious.
- Keep comments concise and in **English**.

---

## 9. Language: English Only

- **Commits:** English, always. (`feat(auth): reject expired sessions`)
- **Pull request** title and description: English.
- **Code comments:** English when comments are needed.
- UI labels, user-facing strings, and URL slugs: match the product's language (e.g., Portuguese for a Brazilian product).

---

## Summary (for quick reference)

1. Build + tests pass → commit
2. Conventional Commits format: `type(scope): description`
3. One logical change per commit
4. Push when all commits are done
5. Branch from up-to-date main: `git pull origin main` first
6. Verify PR status before pushing to existing branch: `gh pr list --head <branch>`
7. Open PR automatically after push: `gh pr create`
8. Minimal comments, English only
