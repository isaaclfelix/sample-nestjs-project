# ADR-0023: Nest host, embedded Vite UI, and typed protocol

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

`src/web/` mixed Nest-executed modules (page loader, asset delivery, page prop types) with the Vite/React tree. That blurred compile graphs (`nodenext` vs `bundler`), forced Nest to emit Vite-owned `.ts`, and put page props beside page components even though Nest must never import page `.tsx` ([ADR-0017](./0017-dual-typescript-build.md)).

We want HTML UI to behave like an **embedded app**: Nest hosts SSR and assets; Vite owns React; a small wire **protocol** is the only shared surface.

## Decision

- **`src/web/host/`** — Nest-executed SSR host (`page-loader`, `asset-delivery`).
- **`src/web/ui/`** — Embedded Vite/React app (pages, islands, server/shared components, hooks, api-fetch, styles, UI runtime, vite-plugins).
- **`src/web/protocol/`** — Wire-only types/data (no Nest decorators, no React/JSX): SSR page props, `ServerEntry`, `PageAssets`/`AssetTags`, island CSS catalog, shell CSS budget helper.
- Nest root keeps `web.module.ts` / `web.controller.ts` / `web-view.service.ts`.
- Import rules: host ↔ protocol and ui ↔ protocol allowed; **host ↛ ui** (except runtime string load of the SSR entry); **ui ↛ host**.
- `tsconfig.build.json` **excludes** `src/web/ui/**`. Web typecheck covers `ui/**` + `protocol/**`.

### SSR page props naming and quirk

Page contracts live under `protocol/page-props/` as `*-page.ssr-props.ts` exporting `*PageSsrProps`, aggregated in `SsrPagePropsMap` / `WebPageName`.

They **are** the page component’s props type, but:

1. Nest **produces** them; Vite SSR **consumes** them (embed boundary, not a React parent).
2. Values must stay **JSON-serializable**.
3. Nest must not import `ui/pages/*.tsx`, so the contract **cannot** live inside the component file or a UI-only folder.
4. Future per-component folders under `ui/pages/` still leave SSR props in `protocol/page-props/`.
5. Island props remain on the island component / `data-props` marker — not this Nest page contract.

Scaffold (`pnpm scaffold:web-ui --mode page`) writes SSR props under `protocol/page-props/` and the page under `ui/pages/`.

### Island registration

Host-readable island identity lives in committed `protocol/islands.ts`; the `islands` map is **gitignored** `protocol/islands.generated.ts` from `pnpm islands:sync`. UI `registry.ts` derives lazy loaders via `import.meta.glob` ([ADR-0028](./0028-island-filesystem-manifest.md)).

## Consequences

- Clear Nest vs Vite ownership; Nest no longer emits the React app tree.
- Typed Nest↔page props retained without colocating contracts under `ui/pages/`.
- Authors must learn the SSR props quirk (documented in how-to).
- Live paths supersede folder examples in [ADR-0018](./0018-island-runtime-folder.md) and [ADR-0020](./0020-web-runtime-folder.md); dual TS ownership in [ADR-0017](./0017-dual-typescript-build.md) still holds with updated excludes.
- Scaffold must stay aligned with protocol paths ([create-web-ui](../../.agents/skills/create-web-ui/SKILL.md)).

## Alternatives considered

- Untyped PHP-style `Record<string, unknown>` page bag — loses Nest↔page type safety for little boundary gain once protocol exists.
- Zod schemas for SSR page props — ceremony without HTTP/OpenAPI payoff at this trusted boundary.
- Mega `ui/` parent without extracting Nest engines — folder depth does not fix the Nest import graph.
- Keeping props beside page TSX — re-mixes Nest contracts into the Vite tree.
