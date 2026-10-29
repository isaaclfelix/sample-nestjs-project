# ADR-0002: Islands SSR UI (not SPA, Next, or full-page React)

- **Status:** Accepted
- **Date:** 2026-10-28

## Context

The product goal for the UI is **solid performance**, not “use React everywhere.” Upcoming CRUD-heavy dashboard pages should stay mostly server HTML, with interactivity only where a control needs it. Nest already routes HTTP; a second browser router would duplicate that job and ship more client JS by default.

## Decision

Use **islands**: Nest owns routes and data; React server-renders the document and hydrates only the islands a page rendered. Controllers pick a **page name** and a **plain props object**; they do **not** import `.tsx`. This is not React Server Components, not a client-side router, and not string templates.

## Consequences

- Same component syntax on server and browser; Vite ships only the JS/CSS a page actually used.
- Unused island chunks are never downloaded—insurance against Core Web Vitals drift from unused JS/CSS.
- Controllers stay free of React compile; see [ADR-0017](./0017-dual-typescript-build.md).

## Alternatives considered

- Full client SPA (e.g. React Router) — re-implements routing; large JS graph by default.
- Separate Next.js (or similar) app — second deploy/CI/host (also rejected in [ADR-0001](./0001-one-nest-process.md)).
- String templates only — different syntaxes for server pages vs interactive widgets.
- One React root for the whole page — non-interactive markup would still reconcile on the client.
