# ADR-0031: Project plan files for agent planning

- **Status:** Accepted
- **Date:** 2026-10-31
- **Tags:** agents, planning, git

## Context

Desktop Plan mode writes a plan under `~/.cursor/plans` and can move it into
the workspace with **Save to workspace** (`.cursor/plans/`). Cloud Agent and
the web composer have no Plan mode picker, so a plan that exists only in the
transcript is easy to lose, and a plan written on the agent machine's home
directory never shows up on the pull request.

We want a plan a reviewer can open on the GitHub pull request, including from
the commits after the file is gone from the branch tip. We do not want those
plans to remain in the tree of `main` after release.

## Decision

- Reviewable implementation plans live in `.cursor/plans/<date>-<slug>.md` in
  the project. That is the same folder **Save to workspace** uses.
- Agents follow
  [plan-before-code](../../.agents/skills/plan-before-code/SKILL.md): research,
  write that file, and wait for approval before editing product code.
- The plan file is committed on the working branch. A later commit on that
  same branch deletes it before merge. Do not drop or rewrite the commit that
  added the file, and do not gitignore `.cursor/plans/`.
- The tip of `main` should not contain plan files. Repository merge settings
  are unchanged: a merge commit keeps the blob reachable from `main`'s
  history; a squash merge leaves it on the pull request commits.

## Consequences

- Pull request review can open the plan from the branch commits after the
  delete commit removes it from the tip.
- A missed delete leaves the plan on `main`. Nothing in CI checks for that
  yet ([TD-034](../known-tech-debt.md)).
- Plan text that lands in a merge commit stays in the repository history of
  every clone. Do not put secrets in plan files.
- Desktop Plan mode still stores its default copy in the home directory. This
  repo's review copy is the project file from the skill.

## Alternatives considered

- Chat-only plans — rejected; the web transcript is not the pull request
  record.
- `~/.cursor/plans` only — rejected; that directory is the developer machine
  or the cloud VM, not the clone reviewers fetch.
- Leave plans on `main` — rejected; the release tree should not keep them.
- Gitignore `.cursor/plans/` — rejected; ignored files never enter the commit
  history the pull request can show.
