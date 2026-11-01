# Wiring

Ordered, **host-agnostic** steps to embed Archipielago. Replace “host” with
your HTTP framework. Nest-specific mapping: [nestjs.md](./nestjs.md). Concepts:
[concepts.md](./concepts.md).

## Host owns vs package owns

| Step                                       | Host                             | Package                                          |
| ------------------------------------------ | -------------------------------- | ------------------------------------------------ |
| Paths / `archipielago.config.ts`           | Yes                              | `core` reads applied config / path getters       |
| Island manifest + `registerIslands`        | Yes                              | `core` stores table                              |
| `setIslandModules(import.meta.glob)`       | Yes (Vite file under product UI) | `react` builds loaders                           |
| Page stylesheet registry + per-page opt-in | Yes                              | `vite` emits `<link>`s                           |
| `entry-server` + `Document` + page map     | Yes                              | `react` `renderDocument`                         |
| Vite config plugins / inputs               | Yes (app Vite config)            | `vite` plugins                                   |
| Mount middleware / static                  | Yes (call helper or DIY)         | `vite` pipeline; Nest: `mountArchipielagoAssets` |
| HTTP route → props → HTML                  | Yes                              | Adapter `render` (optional)                      |

## Steps

1. **Depend** on `core`, `react`, `vite` (+ host adapter if one exists).
   [install.md](./install.md).

2. **Layout product UI** with conventional islands:
   `ui/islands/<name>/<name>.tsx` (+ optional `<name>.module.scss`).
   Keep page props and the islands manifest under a host-owned protocol folder.

3. **Config** — optional `archipielago.config.ts` with
   `islands.registration: 'auto' | 'manual'`. Path overrides via
   `setArchipielagoPaths` when cwd defaults are wrong.

4. **Bootstrap registration**
   - `registerIslands(manifest)`
   - `setPageStylesheetRegistry({ ... })` when using sibling sheets
   - Import the Vite file that calls `setIslandModules(...)` (browser hydrate
     entry; Vitest setup for unit tests)

5. **SSR entry** — implement `ServerEntry`: page map + `Document` →
   `renderDocument` from `@archipielago/react`.

6. **Hydrate entry** — register islands + modules, then `hydrateIslands()`.

7. **Vite** — client inputs (hydrate, shell CSS, opt-in sheets), SSR input
   (entry-server), Archipielago Vite plugins, aliases for product zones.

8. **HTTP mount** — production: static `clientAssetsRoot()`; development:
   `createDevAssetPipeline()` middleware. Do this once at process boot.

9. **Request path** — for each HTML route, build props and call the renderer
   (`ServerEntry` directly or a host adapter). Return `text/html`.

10. **Lifecycle** — sync islands (`auto`) before build/test/start when using
    generated manifests.

## Done when

Same product pages and islands can render through the host without Nest types
inside `core` / `react` / `vite`, and asset URLs work in both Vite middleware
and production static modes.
