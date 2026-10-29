# ADR-0017: Dual TypeScript and build ownership (Nest vs Vite)

- **Status:** Accepted
- **Date:** 2026-10-28

## Context

Nest/`tsc` must not pull React into the API compile. Vite must own client and SSR bundles. Editors need Vite/DOM types for web TSX without breaking the Nest tsconfig.

## Decision

- `tsconfig.build.json` **excludes** `src/web/ui/**` (and historically `src/web/**/*.tsx`) so `nest build` never emits the React app. Live layout: [ADR-0023](./0023-web-host-ui-protocol.md).
- Vite emits client (`dist/client`) and SSR (`dist/web-server`) bundles; `pnpm build` runs `nest build`, `tsc -p tsconfig.web.json --noEmit`, `vite build`, and `vite build --ssr`.
- Web views use `src/web/tsconfig.json` (extends root `tsconfig.web.json`) for Vite/`vite/client` types. Repo-root `tsconfig.json` stays on Nest/API `.ts` and excludes `src/web/ui/**`.
- Prefer `.tsx` for React trees; plain `.ts` for Nest, protocol props, registries, and tests.

## Consequences

- Controllers never statically import page TSX ([ADR-0002](./0002-islands-ssr-ui.md)); `loadServerEntry` resolves the entry at runtime per environment.
- Two typecheck surfaces; contributors must know which tsconfig applies.
- `src/web/` host / ui / protocol layout: [ADR-0023](./0023-web-host-ui-protocol.md) (earlier [ADR-0020](./0020-web-runtime-folder.md) / [TD-020](../known-tech-debt.md) retain history).

## Alternatives considered

- One tsconfig compiling Nest + React together — couples Nest emit to JSX and Vite concerns.
- String templates only (no React compile) — rejected in [ADR-0002](./0002-islands-ssr-ui.md).
