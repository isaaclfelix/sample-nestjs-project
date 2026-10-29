# ADR-0019: `src/web/` folder grouping after islands

- **Status:** Superseded by [ADR-0020](./0020-web-runtime-folder.md)
- **Date:** 2026-10-29

## Context

After [ADR-0018](./0018-island-runtime-folder.md) moved island framework code into `island-runtime/`, the `src/web/` root still mixed Nest wiring, Vite build plugins, page asset helpers, the React document/SSR entry, and loosely named UI folders (`shared/`, `ssr-components/`, `client/`). [TD-020](../known-tech-debt.md) tracked grouping those domains so authors can navigate the tree the same way they navigate `src/api/`.

Nest owns the HTML routes; the root of `src/web/` should stay the Nest module face (controller, view service, module), parallel to how `src/api/` keeps Nest artifacts at feature roots.

## Decision

- Keep **Nest wiring** at `src/web/` root: `web.module.ts`, `web.controller.ts`, `web-view.service.ts`.
- Put **SSR React shell + loader** under `src/web/ssr/` (`document`, `entry-server`, `page-loader`). Dev SSR URL is `/src/web/ssr/entry-server.tsx`.
- Put **head asset helpers** under `src/web/assets/` (`asset-tags`, `page-assets`, `page-stylesheets`, `shell-css-delivery`).
- Put **Vite plugins** under `src/web/vite-plugins/` (shell budget, strip island CSS preload, suppress island CSS inject).
- Name product UI folders explicitly:
  - `server-components/` — server-only presentational React (was `ssr-components/`)
  - `shared-components/` — React pieces imported by both server components and islands (was `shared/`)
  - `islands/` — product interactive islands (unchanged; keeps island-runtime naming)
  - `api-fetch/` — browser CSRF + `fetch` defaults for `/api` (was `client/`)
- Leave `styles.scss`, `tsconfig.json`, and `vite-env.d.ts` at `src/web/` root (shell Vite input + tooling).

## Consequences

- Authors look at Nest files at the web root; framework helpers live in `ssr/`, `assets/`, and `vite-plugins/`.
- Cross-lane UI lives in `shared-components/`; server-only chrome in `server-components/`; browser API helpers in `api-fetch/`.
- [TD-020](../known-tech-debt.md) is closed.
- Scaffold, how-to, and architecture tree must use the new paths.
- **Superseded:** second pass moved engines under `runtime/`, `document` into `server-components/`, and shell CSS to `styles/shell.scss` — see [ADR-0020](./0020-web-runtime-folder.md).

## Alternatives considered

- Nest under `nest/` — would empty the root further but drifts from `src/api/`’s Nest-at-root convention.
- Leave Vite plugins at `src/web/` root — too specialized next to Nest wiring.
- Rename `islands/` to `client-components/` — weakens the link to `island-runtime/` and product vocabulary.
