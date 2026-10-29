# ADR-0020: `src/web/runtime/` engines and styles shell

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

[ADR-0019](./0019-web-folder-grouping.md) grouped Nest-facing web files into `ssr/`, `assets/`, and `vite-plugins/`, and renamed UI folders (`server-components/`, `shared-components/`, `api-fetch/`). A second pass found remaining naming problems:

- `assets/` read like static media (images/fonts), but the modules only resolve/emit head tags and CSS text for SSR.
- `ssr/` mixed the editable HTML document template with loader/entry engines.
- Island, SSR, and asset-delivery helpers are sibling **runtimes** (engines), not product UI.
- The shell Vite entry still lived at `src/web/styles.scss` while siblings and partials lived under `styles/`.

## Decision

- Introduce **`src/web/runtime/`** with three engines:
  - `runtime/island/` — was `island-runtime/` (marker, registry, props codec, hydrate)
  - `runtime/ssr/` — `entry-server.tsx` + `page-loader.ts` only
  - `runtime/asset-delivery/` — was `assets/` (asset-tags, page-assets, page-stylesheets, shell-css-delivery)
- Place **`document.tsx`** under `server-components/` as server-only presentational React (the editable HTML shell for remote CSS/JS/meta), not under `runtime/`.
- Move the shell stylesheet to **`styles/shell.scss`** beside `forms.scss` and `_*.scss` partials.
- Keep Nest wiring and `vite-plugins/` where ADR-0019 put them (Nest at `src/web/` root; plugins outside `runtime/`).

## Consequences

- Authors look in `runtime/` for engines, `server-components/document.tsx` for the document template, and `styles/` for CSS entrypoints.
- Dev hydrate URL is `/src/web/runtime/island/hydrate.tsx`; SSR entry is `/src/web/runtime/ssr/entry-server.tsx`; shell link is `/src/web/styles/shell.scss`.
- [ADR-0019](./0019-web-folder-grouping.md) is **Superseded by ADR-0020**. [ADR-0018](./0018-island-runtime-folder.md) remains Accepted for product islands vs island engine; its live path is now `runtime/island/`.

## Alternatives considered

- Leave `document.tsx` at `src/web/` root — high visibility, but Nest root stays cleaner when document sits with other server-only React.
- Name the asset engine `assets-runtime/` — redundant under parent `runtime/`; `asset-delivery` names the job.
- Keep folder name `island-runtime` under `runtime/` — becomes `runtime/island-runtime/`; prefer `runtime/island/`.
