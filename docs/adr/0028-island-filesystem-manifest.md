# ADR-0028: Island filesystem manifest and glob loaders

- **Status:** Accepted
- **Date:** 2026-10-29
- **Tags:** web, islands, vite, protocol

## Context

After the host / ui / protocol split ([ADR-0023](./0023-web-host-ui-protocol.md)), island identity lived in a hand-maintained `protocol/island-css-catalog.ts` while UI `registry.ts` duplicated names with per-island `import()` loaders. That dual registration fought the per-component folder convention ([ADR-0025](./0025-per-component-folders.md)) and made scaffold patch two files. Nest cannot import the Vite tree or run `import.meta.glob`, so the host still needs a protocol-readable table for SSR CSS inlining and `IslandName`.

## Decision

- **Source of truth:** `src/web/ui/islands/<name>/<name>.tsx` (+ optional `<name>.module.scss`). Islands only — not pages or server-components.
- **`pnpm islands:sync`** walks that tree and writes **gitignored** `src/web/protocol/islands.generated.ts` — **only** the `islands` map (`hasCssModule` flags). Hook sync from `postinstall`, `prebuild`, `prelint`, `pretest*`, and `prestart*`.
- **Committed** `src/archipielago/core/islands.ts` imports that map and owns path helpers, `IslandName`, and guards ([ADR-0029](./0029-archipielago-in-repo-isolation.md)). Sync must not regenerate API surface.
- **UI registry** builds `islandLoaders` from a **non-eager** `import.meta.glob` of `ui/islands/*/*.tsx` (excluding stories/specs), keeping only dirname===basename keys that appear in the generated table. Hydrate stays lazy ([ADR-0012](./0012-island-boundaries.md)).
- **Scaffold** (`--mode island`) creates the folder and runs sync. **Manual** islands: run `pnpm islands:sync` or restart `start:dev` (sync runs at process start). No live watcher on `ui/islands`.

## Consequences

- Authors register islands by adding a conventional folder; no hand-edited loader map or CSS catalog.
- Clones and CI need sync before typecheck/compile (same class of step as Prisma generate).
- Nest `--watch` reloads when scaffold (or sync) rewrites `islands.generated.ts`; adding a folder alone while the server runs does not refresh the host catalog until sync/restart.
- ADR-0023’s “island CSS catalog” note is superseded by this decision for registration shape.

## Alternatives considered

- Hand-maintained protocol catalog + explicit loader map — dual registration; rejected.
- Regenerating helpers/types into one gitignored `islands.ts` — erases durable API on every sync; rejected in favor of map-only codegen.
- Committed full generated module with `--check` on build — simpler offline clones; rejected in favor of gitignored map regen to avoid manifest PR noise.
- Variable `import(\`…/${name}.tsx\`)` without glob — valid lazy alternative; glob matches “folder is the registry” more directly.
- Chokidar on `ui/islands` during `start:dev` — automatic catalog refresh without restart; deferred (extra process); scaffold + sync/restart is enough.
- Request-time Nest `readdir` of `ui/islands` — blurs protocol compile graph and weakens typed `IslandName`.
