---
name: plan-mode-for-cloud
description: >-
  On a Cloud Agent or cursor.com/agents session only, write an implementation
  plan to .cursor/plans and wait for approval before editing product code. Do
  not use this in the desktop IDE or the CLI. Those have Plan mode.
disable-model-invocation: true
icon: book-open
color: blue
---

# Plan mode for cloud

Write a reviewable implementation plan under `.cursor/plans/` and stop before
product changes. Reviewers open that file on the pull request.
[ADR-0031](../../../docs/adr/0031-project-plan-files.md).

This skill is only for a Cloud Agent or the web composer at cursor.com/agents.
The desktop IDE and the CLI already have Plan mode. Do not use this skill
there, and do not treat it as a stand-in for that mode.

## When to follow this skill

Follow it only when both are true:

- The session is a Cloud Agent or cursor.com/agents.
- The user types `/plan-mode-for-cloud`, or asks for a plan before
  implementation.

A request to implement, fix, or open a pull request is not a plan request. Do
the work. Do not divert it into this workflow.

If the session is the desktop IDE or the CLI, stop. Tell the user to use Plan
mode (`Shift+Tab`, the mode picker, or `/plan`). Do not write a plan file
from this skill.

## While planning

1. Read the code and docs the change will touch.
2. Ask in the conversation when a choice would change the plan. Stop until the
   user answers. Do not stall on a detail that has one obvious reading.
3. Write or update one markdown file:

   `.cursor/plans/YYYY-MM-DD-kebab-slug.md`

   Use the session date in `YYYY-MM-DD`. Keep the same file when the user
   revises that effort. Do not open a second file for a rewording.

4. Reply with the path and a short summary. Stop.

During planning, the only write is that plan file. Do not edit product code,
tests, ADRs, or other docs. Do not commit, push, or open a pull request until
the user asks you to implement.

## Plan file

Start with this frontmatter, then the body:

```yaml
---
name: Short imperative name
overview: One or two sentences a reviewer can read without the transcript.
todos:
  - id: kebab-step
    content: What will be done
    status: pending
isProject: true
---
```

`status` is `pending`, `in_progress`, `completed`, or `cancelled`.

Body sections, in this order:

- **Goal** — what is true when the work is done
- **Decisions** — choices already locked, including ADRs to add while
  implementing
- **Approach** — steps, files, and tests
- **Risks** — what can go wrong, including tech debt to record
- **Out of scope**
- **Before merge** — delete this file in a later commit on the same branch
  before merge. Keep the commit that added it. This removal rule is the repo
  rule in every context, not only for this skill. The `plan-files` CI job
  fails while the file is still in the tree. Check the PR template box after
  the delete.

Do not put secrets, tokens, or `.env` values in the plan.

## After the user approves implementation

- Implement the approved plan. Update each todo `status` in the plan file as
  the step finishes.
- Commit the plan file on the branch. Leave that commit in the history.
- The pull request can be reviewed while the file is still in the tree. The
  `plan-files` check stays red until a later commit deletes it.
- Delete the file in a new commit before merge, and check the PR template
  box. Do not amend or drop the commit that added it.

## Refuse

- Any use in the desktop IDE or the CLI, including as a replacement for Plan
  mode
- A plan that exists only in the chat reply
- A plan written under `~/.cursor/plans` or any home directory on the agent
  machine
- Adding `.cursor/plans/` to `.gitignore`
- Product edits before the user approves the plan
- Deleting the plan file before that add is committed, or erasing the
  commit that added it
