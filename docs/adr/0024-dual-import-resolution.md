# ADR-0024: Dual import resolution (Nest `.js` vs Vite extensionless)

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

This package is `"type": "module"` with Nest emit on `moduleResolution: "nodenext"`, so relative imports in Nest-compiled graphs must use **`.js`** emit specifiers ([ADR-0017](./0017-dual-typescript-build.md)). The Vite UI under `src/web/ui/` typechecks with `moduleResolution: "bundler"` and does not need those emit names.

After [ADR-0023](./0023-web-host-ui-protocol.md), the Nest vs Vite ownership line is clear (`host/` + `protocol/` + Nest web root vs `ui/`). Import style should follow that line so authors and oxlint do not “normalize” the wrong way. ADR-0023 also moved SSR page props into `protocol/page-props/`, so the old “Nest props beside Vite pages” mix is gone; dual style is no longer entangled with that layout debt.

## Decision

- **Nest / Node ESM (`.js` always on relative imports):** `src/api/**`, Nest root `src/web/web.*.ts`, `src/web/host/**`, `src/web/protocol/**`, and other Nest-emitted trees. Writing `.js` names the **output** module, not a mistaken source extension.
- **Vite UI (extensionless):** `src/web/ui/**` (pages, islands, server/shared components, hooks, api-fetch, UI runtime, co-located specs). Style follows the **importing file’s zone**, including UI→protocol and UI→selected `src/api` constants.
- **Exception — `src/web/ui/vite-plugins/**`:** these modules load in Vite’s **Node config** graph (imported from root `vite.config.ts`). Vite’s native `configLoader` requires explicit extensions there, so they use Nest-style **`.js`** relatives (including plugin→protocol). They are not browser UI modules.
- Enforce with oxlint `import/extensions`: default `js: always`; override `js: never` for `src/web/ui/**` except `vite-plugins/**` (stays `always`).

## Consequences

- Two deliberate styles instead of one ugly global rule or fighting Nest ESM.
- Agents and scaffold must emit the style for the target zone (UI stubs extensionless; Nest/protocol keep `.js`).
- Crossing the UI→protocol boundary looks extensionless on the UI side while protocol files still import each other with `.js` — intentional.

## Alternatives considered

- `.js` everywhere — one lint rule, but Vite UI pays Nest emit noise for no runtime gain.
- Drop `.js` from `src/api/` — incompatible with nodenext emit without bundling Nest.
- Folder-depth heuristics without `host`/`ui`/`protocol` — brittle; ADR-0023 already drew the ownership line.
