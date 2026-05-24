---
name: commit-and-pr-standards
description: Standards for small commits, PRs from main/master with pull-before-branch, minimal comments (English only for comments, commits, and PRs). Use when creating commits, opening branches, writing PRs, or asking about git workflow.
---

# Commit and PR Standards

Apply these rules when creating commits, opening branches, or writing PRs and code comments.

## 1. Before Committing: Run Build and Tests — MANDATORY, NO EXCEPTIONS

> **STOP. Do not `git commit` until you have run the build AND the tests and both pass.**

- **Run the build first**: `npm run build` / `pnpm build` / `go build ./...` (or whatever the project uses). A passing test suite does NOT mean the build passes — TypeScript errors, missing imports, and lint failures only surface at build time.
- **Then run the tests**: `npm test` / `pnpm test` / `go test ./...`.
- **Both must pass.** If either fails: fix the failure, then re-run both before committing.
- **Never commit a broken build**, even if it "looks like a minor issue" or "CI might catch it". Broken builds block the whole team.
- To find the right commands, check `package.json` (`scripts` section), `Makefile`, or the existing CI workflow files (`.github/workflows/`).

## 2. Commits: Keep Them Small

- **One logical change per commit.** Prefer several small commits over one large commit.
- Each commit should be self-contained and easy to describe in one line.
- If a change does multiple things (e.g., refactor + new feature), split into separate commits when reasonable.
- Small commits make review, bisect, and revert easier.

## 3. After Committing: Push When Done

- **When all commits for the task are finished**, run `git push` (or `git push origin <branch>`) to publish the branch to the remote.
- Do not leave the user to push manually; include push as part of the commit workflow when the agent has completed the commits.

## 4. Branching and Pull Requests

- **New branches and PRs must be based on `main` or `master`** (whatever is the default branch).
- **Before creating a new branch:** always update the base branch first:
  1. `git checkout main` (or `master`)
  2. `git pull origin main` (or `master`)
  3. Then create the new branch: `git checkout -b feature/your-branch-name`
- Never open a PR from a branch that was created from an outdated or unrelated branch. This keeps history clean and reduces merge conflicts.
- **Before pushing to an existing branch — STOP and check the PR status first:**

  > **STOP. Do not `git push` to an existing branch until you have verified the PR is still open.**

  Run: `gh pr list --head <current-branch>`
  - If the PR is **open**: push normally.
  - If the PR is **merged or closed**: do NOT push to this branch. Create a new branch from up-to-date main and open a new PR for the new changes. Pushing to a merged branch orphans commits and confuses history.

- **After pushing a branch:** always open the PR automatically (e.g. `gh pr create` with title/body from the commits or a short summary). Do not leave the user to open the PR manually.

## 5. Comments: Minimal and Meaningful

- **Prefer no comments** when the code is clear by itself.
- **Add comments only when necessary** to explain:
  - Non-obvious architectural or design decisions
  - Complex business rules or algorithms
  - Workarounds or non-obvious constraints (with a brief reason)
- Avoid redundant comments that restate what the code does.
- When you do comment, keep it concise and in **English**.

## 6. Language: English Only

- **Commits:** Write commit messages in **English** (e.g., "Add password change to admin profile", "Fix validation for strong password").
- **Pull requests:** Title and description in **English**.
- **Code comments:** Always in **English** when comments are needed.

Summarize for the agent: **NEVER commit without first running the build AND the tests — both must pass, no exceptions**; small commits; **when all commits are done, run `git push`** so the branch is published; branch from up-to-date main/master; **STOP before pushing to an existing branch — run `gh pr list --head <branch>` first; if the PR is merged or closed, create a new branch from main and open a new PR instead of pushing to the old branch**; **open the PR automatically after push** (e.g. `gh pr create`); minimal comments (only for complex/architectural reasons); use English for commits, PRs, and comments.
