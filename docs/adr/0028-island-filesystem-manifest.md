# ADR-0028: Island filesystem manifest and glob loaders

- **Status:** Accepted (path/gitignore/tooling amended by [ADR-0030](./0030-archipielago-host-config.md))
- **Date:** 2026-10-29
- **Tags:** web, islands, vite, protocol

## Context

After the host / ui / protocol split ([ADR-0023](./0023-web-host-ui-protocol.md)), island identity lived in a hand-maintained `protocol/island-css-catalog.ts` while UI `registry.ts` duplicated names with per-island `import()` loaders. That dual registration fought the per-component folder convention ([ADR-0025](./0025-per-component-folders.md)) and made scaffold patch two files. Nest cannot import the Vite tree or run `import.meta.glob`, so the host still needs a table for SSR CSS inlining (injected into Archipielago, not read by Nest HTTP — [ADR-0029](./0029-archipielago-in-repo-isolation.md)).

## Decision

- **Folder convention (unchanged):** `ui/islands/<name>/<name>.tsx` (+ optional `<name>.module.scss`). Islands only — not pages or server-components.
- **Manifest + sync:** Under sample default `islands.registration=auto` ([ADR-0030](./0030-archipielago-host-config.md)), `pnpm islands:sync` walks that tree and writes **only** the `islands` map (`hasCssModule` flags) to the Nest-sample default manifest path (`src/web/protocol/islands.generated.ts`). This sample hooks sync from `postinstall`, `prebuild`, `prelint`, `pretest*`, and `prestart*`, and gitignores the manifest — host choices, not package requirements. Host-facing path overrides wait for Phase 3.
- **Committed** `src/archipielago/core/islands.ts` owns path helpers and `registerIslands` / `getIslands`. The app injects the manifest at bootstrap and from the browser hydrate entry; Nest HTTP code does not read it. Sync must not regenerate API surface.
- **UI registry** builds loaders lazily via `getIslandLoaders()` from a **non-eager** `import.meta.glob` of `ui/islands/*/*.tsx` (excluding stories/specs), keeping only dirname===basename keys that appear in the injected manifest. Hydrate stays lazy ([ADR-0012](./0012-island-boundaries.md)).
- **Scaffold** (`--mode island`) creates the conventional folder; sync vs manual-entry warning follows registration mode ([ADR-0030](./0030-archipielago-host-config.md)). No live watcher on `ui/islands`.

## Consequences

- Authors register islands by adding a conventional folder (and sync or a manifest row per mode); no hand-edited loader map or CSS catalog.
- Clones on `auto` mode need sync before typecheck/compile (same class of step as Prisma generate) unless the host commits the manifest.
- Nest `--watch` reloads when scaffold (or sync) rewrites the manifest; adding a folder alone while the server runs does not refresh the catalog until sync/restart (or a manual edit + reload in `manual` mode).
- ADR-0023’s “island CSS catalog” note is superseded by this decision for registration shape.

## Alternatives considered

- Hand-maintained protocol catalog + explicit loader map — dual registration; rejected as the **only** mode (manual manifest ownership returns as optional `manual` mode in [ADR-0030](./0030-archipielago-host-config.md)).
- Regenerating helpers/types into one generated `islands.ts` — erases durable API on every sync; rejected in favor of map-only codegen.
- Committed full generated module with `--check` on build — valid host policy; this sample preferred gitignored regen to avoid manifest PR noise (not mandated for embedders — [ADR-0030](./0030-archipielago-host-config.md)).
- Variable `import(\`…/${name}.tsx\`)` without glob — valid lazy alternative; glob matches “folder is the registry” more directly.
- Chokidar on `ui/islands` during `start:dev` — automatic catalog refresh without restart; deferred (extra process); scaffold + sync/restart is enough.
- Request-time Nest `readdir` of `ui/islands` — blurs protocol compile graph and weakens typed names.
