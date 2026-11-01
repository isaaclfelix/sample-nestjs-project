# ADR-0032: Archipielago pnpm monorepo packages and NestJS example

- **Status:** Accepted
- **Date:** 2026-11-01
- **Tags:** archipielago, monorepo, tooling

## Context

Phase 1 isolated engines under `src/archipielago/{core,host,react,vite}` with
the Nest product under `src/web/`
([ADR-0029](./0029-archipielago-in-repo-isolation.md)). Phase 2 must turn this
repository into the Archipielago **pnpm monorepo**: installable framework
packages, shared quality tooling, and a NestJS host example that consumes those
packages ([roadmap](../archipielago/roadmap.md),
[vision](../archipielago/vision.md)).

We need durable answers for package IDs, directory layout, tooling ownership,
how the Nest sample relocates, and how far to go toward npm publish in this
phase—without painting a later first public release into a corner.

## Decision

- **Workspace layout:** framework code lives under `packages/*`; runnable hosts
  under `examples/*`. Root `package.json` is a private orchestrator (scripts,
  shared configs, docs). [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml)
  includes `packages/*` and `examples/*`.
- **Package IDs (Phase 2 surface):**
  - `@archipielago/core` — render/asset/island contracts, generic `ServerEntry`,
    path and config shapes
  - `@archipielago/react` — `<Island>`, SSR `renderDocument`, hydrate; React as
    peer
  - `@archipielago/vite` — Vite plugins plus former `host/` Node asset pipeline
    (`createDevAssetPipeline`, page-loader, asset delivery); host policy
    injected
  - `@archipielago/nestjs` — Nest module / injectable renderer and mount helpers
- **Nest sample relocation:** the current Nest app (API, `src/web/`, Prisma,
  e2e, Storybook) moves to `examples/nestjs`. Example paths and package ids use
  **`nestjs`**, not kinship nicknames.
- **Shared tooling:** oxlint, Prettier, Vitest shared config, Commitlint/Husky,
  and CI entrypoints stay **repo-owned** at the root. Packages and examples use
  thin scripts and `pnpm --filter` / `-r`. Host examples do **not** fork
  lint/test stacks to match upstream framework starters. One IDE workspace root.
- **Publish deferred:** packages ship `"private": true` and `version` `0.0.0`
  with explicit `exports` / `types` / `files` and correct peers so a later first
  public `0.0.1` is mechanical. No Changesets or publish CI in Phase 2. Roadmap
  records the publish milestone separately.
- **Publish-ready invariants:** no reverse imports from packages into
  `examples/*`; `@archipielago/*` consumers use real package imports (not
  long-term path aliases that fake the boundary); app page-prop maps stay
  example-owned via generics.
- **Supersedes** the “folder boundary, no workspace packages” clause of
  [ADR-0029](./0029-archipielago-in-repo-isolation.md). Render-contract,
  Nest-thin surface, and dual import-zone intent from 0029 remain until amended.

## Consequences

- Phase 2 implementation cuts packages along existing folders and relocates the
  Nest sample; CI and scripts become filter-aware.
- [ADR-0030](./0030-archipielago-host-config.md) host config continues to live
  with the example; package APIs accept injected roots. Full host-facing
  `paths` on `archipielago.config.ts` can still wait for Phase 3 second-host
  friction when injection already unblocks the Nest example.
- Authors keep one Cursor window and one quality gate across packages and
  examples.
- First npm publish remains an explicit roadmap milestone after packages exist
  (prefer after Phase 3 contract proof).

## Alternatives considered

- **Leave Nest at repo root and only extract packages** — delays the monorepo
  shape vision already recorded; rejected.
- **One mega `@archipielago` package** — harder peer/graph story for React vs
  Nest adapters; rejected in favor of the four-package surface.
- **Publish to npm in Phase 2** — premature before the second-host contract
  proof; rejected in favor of publish-ready workspace packages.
- **Per-example lint/test stacks** — recreates mini-repos and IDE friction;
  rejected ([vision](../archipielago/vision.md) shared tooling).
- **Keep `@archipielago/host` separate from Vite** — today’s `host/` is
  Node/Vite infrastructure; merging into `@archipielago/vite` matches the
  roadmap “Vite helpers” cut and avoids a fifth package with no clear peer
  story.
