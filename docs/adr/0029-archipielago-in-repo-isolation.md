# ADR-0029: In-repo Archipielago isolation (folder boundary, no packages yet)

- **Status:** Accepted
- **Date:** 2026-10-30

## Context

Phase 0 recorded Archipielago as embeddable islands infrastructure with a
rendering-contract design rule (see [docs/archipielago/](../archipielago/)).
The Nest sample still owned engines under `src/web/host/`, `ui/runtime/`, and
shared protocol files mixed with app page props ([ADR-0023](./0023-web-host-ui-protocol.md)).

Phase 1 needs an **in-repo** package outline so Phase 2 (pnpm workspace /
`@archipielago/*`) is mechanical. We must not publish packages yet, must keep
one Nest process for API + SSR + assets ([ADR-0001](./0001-one-nest-process.md)),
and must keep Nest types out of the render seam.

## Decision

- **Folder boundary (no workspace packages):** engines live under
  `src/archipielago/{core,host,react,vite}`. Product Nest UI stays under
  `src/web/` (`web.*`, `ui/pages|islands|server-components|styles|…`,
  `protocol/page-props/`, generated `islands.generated.ts`, thin
  `ui/runtime/ssr/entry-server.tsx`).
- **Full-document `RenderResult`:** `render → { html, assets }` where `html` is
  a complete document (doctype included). Product `Document` stays injectable
  (title/branding). Nest `WebViewService` returns `result.html` only.
- **Path config:** `ArchipielagoPaths` (`get`/`setArchipielagoPaths`) owns
  islands, hydrate, SSR entry, client out, and related roots. Defaults match
  this repo’s Nest sample layout.
- **Vite pipeline vs Nest mount:** `createDevAssetPipeline` / `clientAssetsRoot`
  create and register Vite; Nest `main.ts` only mounts middleware or static
  assets. No Nest/Express types inside `src/archipielago/**`.
- **Aliases:** `@archipielago/*` → `src/archipielago/*` alongside `@ui` /
  `@protocol` / `@api` ([ADR-0027](./0027-ui-path-aliases.md)).
- **Compile zones:** Nest emits `archipielago/core` + `host` (`.js` relatives);
  Vite owns `archipielago/react/**` (extensionless); `archipielago/vite/**` stays
  Node config graph (`.js`) ([ADR-0024](./0024-dual-import-resolution.md)).

Live folder layout for host / UI / protocol **supersedes** the
`src/web/host|ui|protocol` engine paths in [ADR-0023](./0023-web-host-ui-protocol.md).
SSR page-props quirk and Nest-thin `web.*` surface from ADR-0023 remain.

## Consequences

- Phase 2 can cut packages along existing folders without redesigning the seam.
- Islands table is **injected** via `registerIslands` (app bootstrap + hydrate
  entry); Nest does not consume the manifest for responses. Core still imports
  app **page-prop** types in-repo ([TD-030](../known-tech-debt.md)) until package
  extraction generics that contract.
- Process-global `setViteDevServer` remains ([TD-031](../known-tech-debt.md)).
- `RenderResult.assets` duplicates data already embedded in `html` until a
  second host needs assembly ([TD-032](../known-tech-debt.md)).

## Alternatives considered

- **Logic-only isolation without folder move** — leaves Phase 2 with path and
  package churn together; rejected.
- **Early pnpm workspace packages in Phase 1** — steals Phase 2 scope; rejected.
- **Body fragment `html` without document ownership** — harder host wiring;
  rejected in favor of full document + injectable product `Document`.
