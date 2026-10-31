---
name: create-pr
description: >-
  Push the current branch and create or update a GitHub pull request with a
  standardized description via the gh CLI. Use when the user asks to open a PR,
  create a pull request, update a PR description, or runs /create-pr.
---

# Create Pull Request

Create or update pull requests **only when the user explicitly asks** (e.g. `/create-pr`, "open a PR", "update the PR description"). If unclear, ask first.

This NestJS project uses **[GitHub CLI](https://cli.github.com/)** (`gh`) for PRs. Branch and commit rules live in [CONTRIBUTING.md](../../../CONTRIBUTING.md). The human-facing form of the body is [`.github/PULL_REQUEST_TEMPLATE.md`](../../../.github/PULL_REQUEST_TEMPLATE.md) — keep sections in sync with this skill.

**Mutations use REST only:** create and update PRs with `gh api` against the Pulls REST endpoints. Do **not** use `gh pr create` / `gh pr edit` — those GraphQL paths fail here (Projects classic `projectCards` deprecation) and waste a retry before a REST fallback. `gh pr view --json` is fine for inspect/verify.

## Defaults

| Setting                        | Value                                                     |
| ------------------------------ | --------------------------------------------------------- |
| Base branch                    | **`main`** unless the user names another base             |
| Head                           | Current local branch                                      |
| Existing open PR for this head | **Update** title/body (and push); do not open a second PR |
| Force push                     | Never, unless the user explicitly requests it             |

Git cannot infer PR base from history. Do **not** guess base from merge-base. When a PR already exists, keep its base unless the user asks to change it.

## Title

Prefer Conventional Commit style for the **whole PR** (not necessarily the tip commit):

- Imperative mood, lowercase type, optional scope, under ~100 characters
- Examples: `chore: align prettier oxlint and editorconfig for shared style`, `feat(user): reject duplicate emails`

## Body template

Section order is fixed. Omit **Changes** only when **Summary** already covers the PR. Always include **Tech debt**, **Architecture decisions**, and **Spotcheck**.

```markdown
## Summary

- …

## Motivation

…

## Changes

- …

## Risks / notes

- …

## Tech debt

- …

## Architecture decisions

- …

## Spotcheck

- [ ] Branch name matches CONTRIBUTING (`type/kebab-case`)
- [ ] Commits follow Conventional Commits / Commitlint
- [ ] `pnpm lint` passes (no warnings)
- [ ] `pnpm build` passes (Nest/`tsc` compile)
- [ ] Unit tests pass (`pnpm test`)
- [ ] E2E tests pass or updated (`pnpm test:e2e`) when HTTP/controllers change
- [ ] Coverage thresholds pass (`pnpm test:cov`)
- [ ] Manual / API spotchecks for behavior changed in this PR (list below or N/A)
- [ ] Docs updated if needed (`CONTRIBUTING.md`, README, `docs/known-tech-debt.md`, `docs/testing-and-coverage.md`)
- [ ] No plan file remains under `.cursor/plans/` at the branch tip (removed before merge, or this PR added none)
- [ ] Ready for review
```

### Section rules

- **Summary:** 2–5 outcome bullets (what landed), not a file dump.
- **Motivation:** Why this PR exists (problem or goal).
- **Changes:** Extra detail (API shape, config keys, migrations) when Summary is not enough; otherwise omit the whole section.
- **Risks / notes:** Breaking changes, rollout caveats, follow-ups. Use a single bullet `None` when empty — do not leave the section blank. Do **not** put TD-IDs only here.
- **Tech debt:** Always present and explicit. Cross-check [docs/known-tech-debt.md](../../../docs/known-tech-debt.md) and any `it.fails` / known-tech-debt tests in the diff.
  - If nothing applies: one bullet `- **None**`
  - Else list each item with ID when known, e.g. `- **TD-001** ([docs/known-tech-debt.md](../docs/known-tech-debt.md)): …`
  - Call out **new** debt this PR introduces (and that docs/`it.fails` were updated) or **resolved** debt (ID + cleanup).
- **Architecture decisions:** Always present and explicit. Cross-check [docs/adr/](../../../docs/adr/README.md).
  - If nothing applies: one bullet `- **None**`
  - Else list new or superseded ADR-IDs (and that architecture current-state links were updated).
- **Spotcheck:** Single bottom sign-off (no separate Checklist). Check boxes only for steps actually verified in this session. Nest defaults: `pnpm lint`, `pnpm build`, `pnpm test`, `pnpm test:e2e`, `pnpm test:cov`, plus HTTP/API checks when endpoints change. Check the `.cursor/plans/` box when that directory has no file at the branch tip: the plan was deleted in a later commit, or this PR never added one. Leave it unchecked while a plan file is still in the tree (`plan-files` CI fails in that state). Do **not** check **Ready for review** unless the user asked to assert that. Add PR-specific bullets under the manual/API line when useful. See [docs/testing-and-coverage.md](../../../docs/testing-and-coverage.md).

## Agent shell (required for `gh`)

Cursor's **default agent Shell sandbox blocks `api.github.com`**. Running `gh` there yields `Forbidden` or a false "token is invalid". That is not a broken `gh` install — see [AGENTS.md §8](../../../AGENTS.md).

For **every** Shell invocation that runs `gh` or pushes/fetches `origin` over the network, set:

```text
required_permissions: ["all"]
```

(`full_network` can work for HTTPS-only `gh` calls; prefer `all` so push/SSH and `gh` behave like the user's terminal.)

Do **not** ask the user to run `gh`, drive their terminal with Computer Use, or re-auth unless `gh auth status` fails under `required_permissions: ["all"]`.

## Workflow

### 1. Preconditions (fail fast)

Stop with a clear message if any fail:

- [ ] User explicitly requested a PR or PR description update
- [ ] Working tree clean (`git status`) — if dirty, ask to commit or stash first
- [ ] `origin` remote exists (`git remote -v`)
- [ ] `gh` authenticated (`gh auth status`) — check with `required_permissions: ["all"]`
- [ ] Current branch is **not** a long-lived branch: `main`, `master`, `develop`, `staging`
- [ ] Branch name matches CONTRIBUTING (`type/kebab-case`) unless the user overrides

### 2. Inspect (parallel)

```bash
git status
git branch --show-current
git remote -v
git log <base>..HEAD --format="%s%n%n%b---"
git diff <base>...HEAD
gh pr view --json number,url,title,baseRefName,state 2>/dev/null || true
```

Use `<base>` = `main` or the user override. Prefer three-dot `git diff <base>...HEAD` for the PR range. Run the `gh` line (and later create/edit/verify) with `required_permissions: ["all"]`.

### 3. Draft title and body

- Fill every required section from the branch commits and diff.
- Write the body to a temp file for `gh` (reliable quoting):

```bash
PR_BODY="$(mktemp)"
# write markdown body into "$PR_BODY"
```

### 4. Push

```bash
git push -u origin HEAD
```

Run with `required_permissions: ["all"]` (see **Agent shell** above).

- Never `--force` / `--force-with-lease` unless the user explicitly requests it.
- If the pre-push hook rejects the branch name, fix or stop — do not bypass hooks unless the user explicitly asks (`HUSKY=0`).

### 5. Create or update (REST via `gh api`)

Resolve the repo once, then create or patch. Always use `required_permissions: ["all"]`. Build the JSON body with **Python** (do not rely on `jq` — it is often missing in WSL/agent images) and pipe to `gh api --input -`:

```bash
OWNER_REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
HEAD="$(git branch --show-current)"
```

**No open PR** for this head branch (`<base>` defaults to `main`):

```bash
python3 - "$PR_BODY" "<title>" "$HEAD" "<base>" <<'PY' \
| gh api --method POST "repos/${OWNER_REPO}/pulls" --input -
import json, sys
from pathlib import Path
body_path, title, head, base = sys.argv[1:5]
print(json.dumps({
  "title": title,
  "body": Path(body_path).read_text(),
  "head": head,
  "base": base,
}))
PY
```

**Open PR exists** (`gh pr view` returns `number`, `state` is `OPEN`):

```bash
python3 - "$PR_BODY" "<title>" <<'PY' \
| gh api --method PATCH "repos/${OWNER_REPO}/pulls/<number>" --input -
import json, sys
from pathlib import Path
body_path, title = sys.argv[1:3]
print(json.dumps({
  "title": title,
  "body": Path(body_path).read_text(),
}))
PY
```

- Do not change base on update unless the user asked.
- If state is `CLOSED` or `MERGED`, do not silently reopen; report the URL and ask whether to open a new PR.
- Do **not** call `gh pr create` / `gh pr edit` first.

### 6. Verify

```bash
gh pr view --json url,title,baseRefName,state
```

(Use `required_permissions: ["all"]`.) Return the PR URL to the user. Remove the temp body file when done.

## Safety

- Never update git config
- Never skip hooks unless the user explicitly requests it
- Never force-push `main` / `master`; warn if asked to force-push anything
- Do not push or open a PR unless the user explicitly asked for this skill’s workflow

## Checklist before finishing

- [ ] User explicitly requested the PR
- [ ] All `gh` / `git push` Shell calls used `required_permissions: ["all"]` (or equivalent)
- [ ] Base is `main` or the user-specified branch
- [ ] Body includes Summary, Motivation, Risks / notes, Tech debt, Architecture decisions, Spotcheck
- [ ] Tech debt is explicit (`None` or TD-IDs / new / resolved)
- [ ] Architecture decisions is explicit (`None` or ADR-IDs / new / superseded)
- [ ] Spotcheck boxes reflect only verified steps
- [ ] Branch pushed to `origin`
- [ ] PR created or updated via REST (`gh api` POST/PATCH …/pulls), not `gh pr create`/`edit`
- [ ] PR URL reported to the user
