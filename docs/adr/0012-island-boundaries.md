# ADR-0012: Island boundaries (JSON props, lazy chunks, no shared client context)

- **Status:** Accepted
- **Date:** 2026-10-28

## Context

Islands must hydrate safely from SSR markers. Props cross an HTML attribute boundary. Shipping every island’s JS on every page would undo the download-only-what-you-need rule from [ADR-0002](./0002-islands-ssr-ui.md).

## Decision

- Island props are **JSON-serializable plain objects** (`encodeURIComponent(JSON.stringify(props))` on `data-props`). Reject arrays, null, and non-objects at decode.
- Each marker gets its own **`hydrateRoot`**; islands **do not share** React context or client state after hydration.
- Client entry imports a **lazy registry** of dynamic `import()` loaders—not island modules themselves. Do not preload all `dynamicImports` in the document shell.
- Keep Vite’s default runtime **`modulepreload`** for dynamic imports until viewport/streaming hydration ([TD-010](../known-tech-debt.md)) or CWV pressure; then consider `build.modulePreload: false`.

## Consequences

- Unused islands never download their JS chunks.
- Cross-island shared client state is deferred debt ([TD-008](../known-tech-debt.md)), not current contract.
- Richer (non-JSON) prop graphs wait until a dashboard needs them.
- Folder layout for islands vs registry plumbing and broader `src/web/` grouping: [ADR-0018](./0018-island-runtime-folder.md), [ADR-0020](./0020-web-runtime-folder.md) ([TD-019](../known-tech-debt.md), [TD-020](../known-tech-debt.md) closed).

## Alternatives considered

- Eager import of all islands in hydrate — ships unused JS.
- Shared React context across islands now — real design work without a product need.
- Non-JSON props in markers — unsafe/fragile across HTML attributes.

## Note

Folder layout for product islands vs registry / marker / hydrate plumbing was decided in [ADR-0018](./0018-island-runtime-folder.md) ([TD-019](../known-tech-debt.md) closed). Broader `src/web/` root grouping is [ADR-0020](./0020-web-runtime-folder.md) ([TD-020](../known-tech-debt.md) closed).
