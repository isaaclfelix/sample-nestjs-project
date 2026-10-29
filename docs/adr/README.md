# Architecture Decision Records

This folder records **durable tradeoffs** we chose on purpose. It is the counterpart to [known tech debt](../known-tech-debt.md): ADRs are accepted decisions; tech debt is deferred work.

Current wiring and behavior live in [architecture.md](../architecture.md). That doc stays a **current-state map** and links here with `See ADR-NNNN` where a section comes from a decision.

## Policy

- When a durable tradeoff is chosen, add an ADR **in the same PR** (or immediately after). Update architecture current-state and the ADR link. Do not leave “why” only in the PR description.
- One decision per file under `docs/adr/NNNN-short-slug.md`. Closely coupled micro-choices belong in the same ADR as Consequences, not as separate files.
- **Superseding:** write a new ADR, set the old Status to `Superseded by ADR-…`. Do not silently rewrite history; append a short note if correcting facts on an Accepted ADR.
- Copy [`_template.md`](./_template.md) for new records. IDs are zero-padded (`ADR-0001`, …), sorted in the table below.

## Status legend

| Status     | Meaning                                      |
| ---------- | -------------------------------------------- |
| Accepted   | In force; architecture and code should match |
| Superseded | Replaced by a newer ADR (link in Status)     |
| Proposed   | Draft; not yet binding                       |

## Index

| ID  | Title                                               | Status | File |
| --- | --------------------------------------------------- | ------ | ---- |
| —   | _(none yet — first batch lands in the next commit)_ | —      | —    |
