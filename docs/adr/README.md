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

| ID       | Title                                                          | Status                 | File                                                                                     |
| -------- | -------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------- |
| ADR-0001 | One Nest process for API, SSR, and assets                      | Accepted               | [0001-one-nest-process.md](./0001-one-nest-process.md)                                   |
| ADR-0002 | Islands SSR UI (not SPA, Next, or full-page React)             | Accepted               | [0002-islands-ssr-ui.md](./0002-islands-ssr-ui.md)                                       |
| ADR-0003 | URL prefixes via RouterModule                                  | Accepted               | [0003-router-module-prefixes.md](./0003-router-module-prefixes.md)                       |
| ADR-0004 | Zod and StandardSchemaValidationPipe as HTTP contract          | Accepted               | [0004-zod-standard-schema-http.md](./0004-zod-standard-schema-http.md)                   |
| ADR-0005 | PostgreSQL, Prisma 7, and repository port                      | Accepted               | [0005-persistence-postgres-prisma.md](./0005-persistence-postgres-prisma.md)             |
| ADR-0006 | Cookie sessions and CSRF for first-party browser UI            | Accepted               | [0006-cookie-sessions-csrf.md](./0006-cookie-sessions-csrf.md)                           |
| ADR-0007 | Guest signup and owner-only user mutations                     | Accepted               | [0007-user-mutation-authz.md](./0007-user-mutation-authz.md)                             |
| ADR-0008 | Argon2id password hashing                                      | Accepted               | [0008-argon2id-passwords.md](./0008-argon2id-passwords.md)                               |
| ADR-0009 | Allowlisted user responses and DELETE 204                      | Accepted               | [0009-allowlisted-responses-delete-204.md](./0009-allowlisted-responses-delete-204.md)   |
| ADR-0010 | E2E database via Testcontainers                                | Accepted               | [0010-e2e-testcontainers.md](./0010-e2e-testcontainers.md)                               |
| ADR-0011 | Two-pass renderToString SSR                                    | Accepted               | [0011-two-pass-render-to-string.md](./0011-two-pass-render-to-string.md)                 |
| ADR-0012 | Island boundaries (JSON props, lazy chunks, no shared context) | Accepted               | [0012-island-boundaries.md](./0012-island-boundaries.md)                                 |
| ADR-0013 | CSS in three lanes with handpicked Bootstrap                   | Accepted               | [0013-css-three-lanes.md](./0013-css-three-lanes.md)                                     |
| ADR-0014 | Forms as shared opt-in sibling stylesheet                      | Accepted               | [0014-forms-sibling-stylesheet.md](./0014-forms-sibling-stylesheet.md)                   |
| ADR-0015 | Island CSS as SSR sibling style tags                           | Accepted               | [0015-island-css-sibling-style.md](./0015-island-css-sibling-style.md)                   |
| ADR-0016 | Handpicked Bootstrap Icons SVGs                                | Accepted               | [0016-handpicked-bootstrap-icons.md](./0016-handpicked-bootstrap-icons.md)               |
| ADR-0017 | Dual TypeScript and build ownership (Nest vs Vite)             | Accepted               | [0017-dual-typescript-build.md](./0017-dual-typescript-build.md)                         |
| ADR-0018 | Island product modules vs `island-runtime/`                    | Accepted               | [0018-island-runtime-folder.md](./0018-island-runtime-folder.md)                         |
| ADR-0019 | `src/web/` folder grouping after islands                       | Superseded by ADR-0020 | [0019-web-folder-grouping.md](./0019-web-folder-grouping.md)                             |
| ADR-0020 | `src/web/runtime/` engines and styles shell                    | Accepted               | [0020-web-runtime-folder.md](./0020-web-runtime-folder.md)                               |
| ADR-0021 | Vitest browser UI testing and in-repo QA ownership             | Accepted               | [0021-vitest-browser-ui-testing.md](./0021-vitest-browser-ui-testing.md)                 |
| ADR-0022 | Unix/WSL-first local platform and durable Playwright cache     | Accepted               | [0022-unix-wsl-playwright-browser-cache.md](./0022-unix-wsl-playwright-browser-cache.md) |
| ADR-0023 | Nest host, embedded Vite UI, and typed protocol                | Accepted               | [0023-web-host-ui-protocol.md](./0023-web-host-ui-protocol.md)                           |
