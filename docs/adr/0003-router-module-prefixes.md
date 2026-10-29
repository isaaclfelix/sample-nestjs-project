# ADR-0003: URL prefixes via RouterModule

- **Status:** Accepted
- **Date:** 2026-10-28

## Context

E2E boots `AppModule` and never runs `src/main.ts`. A global prefix set only in bootstrap would not apply in tests. Folder names alone must not invent URL structure.

## Decision

Register API path prefixes with Nest **`RouterModule.register`** in the module graph (e.g. `path: 'api'` on `ApiModule`, child modules for nested controllers). Do **not** use `app.setGlobalPrefix` for the API. `WebModule` has no path so pages stay at the root.

## Consequences

- E2E and production share the same prefix wiring.
- A test that imports `UserModule` alone will not see `/api`.
- Page controllers must not claim `/api`, `/assets`, `/src`, or `/@vite`.

## Alternatives considered

- `setGlobalPrefix('api')` in `main.ts` — missing in e2e that boot `AppModule` without `main`.
- Folder-derived URLs — Nest does not map folders to prefixes; would confuse contributors.
