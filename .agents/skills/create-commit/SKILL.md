---
name: create-commit
description: >-
  Create git commits for this repository using Conventional Commits and
  Commitlint. Use when the user asks to commit, save work to git, write a commit
  message, or stage and commit changes.
---

# Create Commit

Create commits **only when the user explicitly asks** (e.g. "commit this", "make a commit"). If unclear, ask first.

The incremental-commits section in [AGENTS.md](../../../AGENTS.md) is an explicit ask. When that rule applies, commit each finished slice without waiting for another message. Do not push unless the user asks.

This NestJS project enforces [Conventional Commits](https://www.conventionalcommits.org/) with **Commitlint** (`@commitlint/config-conventional`) via a Husky `commit-msg` hook. See [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## Message format

Every commit has a **subject** (first line). Most commits also include a **body** (blank line, then bullet list). **Very small changes** may use a **subject-only** message when the subject fully describes the diff.

**Default (multi-change or non-trivial):**

```
type(optional-scope): imperative subject under 100 chars

- First change summarized in plain language
- Second change
- Third change
```

**Subject-only (very small changes):**

```
fix(user): reject empty PATCH bodies
```

### Subject line

- Pattern: `type(optional-scope): subject` (see [CONTRIBUTING.md](../../../CONTRIBUTING.md))
- **Types** (lowercase only): `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`
- **Scope** optional in parentheses: `feat(user): reject duplicate emails`
- **Subject**: imperative mood, lowercase start, no trailing period, max **100** characters (Commitlint `header-max-length`)
- **Branch vs commit**: branches use `feat/user-uniqueness`; commits use `feat(user): reject duplicate emails`

Pick the type that matches intent: `feat` = user-facing or API behavior, `fix` = bug, `refactor` = no intended behavior change, `chore` = tooling/deps, etc.

### Body

- **Default**: blank line after subject, then a **bullet list** (`- `) summarizing each logical change in the commit
- **Skip the body** when the change is very small and the subject already says everything (e.g. one typo, a single obvious fix, a one-line config tweak, formatting one file). Do not add bullets that only restate the subject.
- One bullet per distinct change area (file group, feature slice, or behavior change)
- Imperative or past-tense phrases are fine; be specific (what and why), not file dumps
- Wrap lines at **100** characters (`body-max-line-length`)
- Do not repeat the subject verbatim in the first bullet

### Footer (optional)

- `BREAKING CHANGE: description` when the commit breaks consumers
- `Refs #123` only if the user or team process uses ticket IDs

## Workflow

### 1. Inspect changes (parallel)

```bash
git status
git diff
git diff --staged
git log -10 --format="%s%n%n%b---"
```

Read staged and unstaged diffs. If files that belong to this commit are unstaged, stage those paths before drafting the message. Do this whether the index is empty or already has other files. Stage only the paths for this commit, and leave files that belong to a later slice unstaged. Never stage secrets: `.env`, credentials, or keys. An unstaged tree is not a reason to skip the commit.

### 2. Draft the message

- Subject: one clear outcome of the commit
- **Subject-only** if the diff is very small and self-explanatory; otherwise add a body
- Body bullets: 2–8 items typical; merge tiny edits into one bullet; split unrelated work into separate commits if the user agrees

**Subject-only example:**

```
docs: link contributing guide
```

**Body example:**

```
feat(user): reject duplicate emails and extra PATCH fields

- Enforce case-insensitive unique email and username in UserService
- Use strict Zod schemas and require at least one PATCH field
- Map stored users to response DTOs without spreading class instances
```

### 3. Validate with Commitlint (required)

Use the **project** binary (`pnpm exec commitlint`), not `pnpm dlx`. For subject-only commits, pipe just the subject line.

```bash
# Bash / WSL — subject only
printf '%s\n' "fix(user): correct map delete no-op" | pnpm exec commitlint

# Bash / WSL — subject + body
printf '%s\n\n%s\n' "feat(user): subject" "- bullet one" "- bullet two" | pnpm exec commitlint
```

Fix any errors before committing. The Husky `commit-msg` hook runs the same check; do not use `--no-verify` unless the user explicitly requests it.

### 4. Commit

**Git safety** (never violate):

- Never update git config
- Never `--no-verify` / skip hooks unless the user explicitly requests it
- Never destructive commands (`push --force`, `reset --hard`) unless explicitly requested
- Never force-push `main`/`master`; warn if asked
- Avoid `git commit --amend` unless: user asked for amend, HEAD commit is yours in this session, and branch is not pushed
- If a hook fails, fix the issue and make a **new** commit (do not amend a failed commit)
- Do not push unless the user asks

**Stage and commit**

Subject-only:

```bash
git add <paths>
git commit -m "type(scope): subject line"
```

With body (Bash / WSL — preferred HEREDOC):

```bash
git add <paths>
git commit -m "$(cat <<'EOF'
type(scope): subject line

- Bullet summarizing change one
- Bullet summarizing change two

EOF
)"
```

Or write the message to a temp file and use `git commit -F path`.

### 5. Verify

```bash
git status
git log -1 --format=full
```

If **pre-commit** (lint-staged) reformats files, stage those changes and commit again (new commit or amend only per amend rules above).

## Type selection guide

| Type       | Use when                                          |
| ---------- | ------------------------------------------------- |
| `feat`     | New behavior API consumers or users notice        |
| `fix`      | Bug fix                                           |
| `docs`     | Documentation only                                |
| `refactor` | Restructure without intended behavior change      |
| `test`     | Tests only                                        |
| `chore`    | Deps, tooling, config, housekeeping               |
| `style`    | Formatting only (Prettier/oxlint style, no logic) |
| `perf`     | Performance improvement                           |
| `build`    | Build system (Nest CLI, Vite)                     |
| `ci`       | CI/CD config                                      |
| `revert`   | Reverting a prior commit                          |

**Scope hints** for this repo: `user`, `auth`, `common`, `dto` — use when it clarifies the area; omit if the change is broad.

## Hooks

- **commit-msg**: Commitlint validates Conventional Commits (`pnpm exec commitlint --edit`)
- **pre-commit**: lint-staged runs oxlint (`--type-aware --deny-warnings --fix`) and Prettier on staged `*.ts`, Prettier on `*.{json,md}`
- **pre-push**: branch names must be `type/kebab-case` (see CONTRIBUTING.md); `main`/`master`/`develop`/`staging` are allowed

Emergency bypass (only if user explicitly requests): `HUSKY=0 git commit` (Bash/WSL) or `$env:HUSKY=0; git commit` (PowerShell). Prefer fixing the message instead.

## Checklist before committing

- [ ] User explicitly requested a commit, or AGENTS.md incremental commits applies
- [ ] Paths for this commit are staged, including ones that were unstaged
- [ ] Later slices and secrets (`.env`, credentials, keys) are not staged
- [ ] Subject passes Conventional Commits (`pnpm exec commitlint`)
- [ ] Body included when the change is not very small; otherwise subject-only is enough
- [ ] Type and scope match the diff
- [ ] Unrelated changes split or called out to the user
