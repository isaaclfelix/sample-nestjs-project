---
name: plan-before-code
description: >-
  Write an implementation plan to .cursor/plans and wait for approval before
  editing product code. Use when the user asks to plan, design an approach,
  or hold coding until a written plan is approved, including Cloud Agent and
  web sessions that have no Plan mode.
disable-model-invocation: true
icon: book-open
color: blue
---

# Plan before code

Write a reviewable implementation plan under `.cursor/plans/` and stop before
product changes. Use this when IDE Plan mode is unavailable. Reviewers open
that file on the pull request.
[ADR-0031](../../../docs/adr/0031-project-plan-files.md).

## When to follow this skill

Follow it when the user:

- types `/plan-before-code`
- asks for a plan, a design, or an approach before implementation
- asks to hold coding until they approve a written plan

A request to implement, fix, or open a pull request is not a plan request. Do
the work. Do not divert it into this workflow.

Desktop Plan mode can still draft a plan in the IDE. When this skill runs,
the review copy is the project file below. Do not leave the only copy in
`~/.cursor/plans`.

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
  before merge. Keep the commit that added it. The tip of `main` must not
  contain this file. The pull request commits must still show it.

Do not put secrets, tokens, or `.env` values in the plan.

## After the user approves implementation

- Implement the approved plan. Update each todo `status` in the plan file as
  the step finishes.
- Commit the plan file on the branch. Leave that commit in the history.
- Leave the file in the tree while the pull request is in review so the diff
  still shows it.
- Delete the file in a new commit only when the user asks to prepare the
  branch for merge. Do not amend or drop the commit that added it.

## Refuse

- A plan that exists only in the chat reply
- A plan written under `~/.cursor/plans` or any home directory on the agent
  machine
- Adding `.cursor/plans/` to `.gitignore`
- Product edits before the user approves the plan
- Deleting the plan file before the user asks, or erasing the commit that
  added it
