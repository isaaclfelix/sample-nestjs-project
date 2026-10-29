# ADR-0018: Island product modules vs `island-runtime/`

- **Status:** Accepted
- **Date:** 2026-10-28

## Context

[`src/web/islands/`](../../src/web/islands/) mixed product island components (`mobile-navigation`, auth forms, …) with framework plumbing (`Island` marker, lazy registry, and later the hydrate entry via `client/`). That blurred the same separation we already use for `pages/`, `shared/`, and `server-components/`. [TD-019](../known-tech-debt.md) tracked the cleanup; [ADR-0012](./0012-island-boundaries.md) deferred folder layout without choosing names.

We also wanted a clear home for island **runtime** (marker, registry, props codec, hydrate) without folding browser fetch helpers (CSRF, `apiRequestDefaults`) into that group.

## Decision

- Keep **product islands** under `src/web/islands/` (component + optional `*.module.scss`), side by side with `server-components/`.
- Put island **runtime** under `src/web/island-runtime/`: `Island` + CSS/name contexts, lazy `registry`, `island-props`, and the hydrate browser entry.
- Keep **browser fetch helpers** under slim `src/web/client/` (`csrf`, `apiRequestDefaults`) for hooks and islands to import; they are not island runtime.

## Consequences

- Authors look in `islands/` for interactive UI and in `island-runtime/` for framework wiring; scaffold and docs match that split.
- Hydrate entry path is `/src/web/island-runtime/hydrate.tsx` (dev) / Vite `hydrate` input (prod).
- Registry loaders dynamic-import `../islands/<name>.js`; `cssModulePath` stays under `/src/web/islands/…`.
- [TD-019](../known-tech-debt.md) is closed. Broader flat-root grouping of Nest wiring, Vite plugins, and asset helpers remains [TD-020](../known-tech-debt.md).

## Alternatives considered

- Rename product folder to `island-components/` — clearer `-components` symmetry with `server-components/`, but fights the product word “island” used in markers, hydrate, and docs.
- Leave plumbing at `src/web/` root (`island.tsx`, `island-registry.ts`) next to `island-props` — fine for TD-019 alone; worsens the flat root that TD-020 wants to clean up.
- Put hydrate under a generic `runtime/` with fetch helpers — mixes island framework code with API request utilities.
