# ADR-0030: Archipielago host config and islands registration mode

- **Status:** Accepted
- **Date:** 2026-10-31
- **Tags:** archipielago, islands, tooling

## Context

Archipielago engines consume an injected islands table
([ADR-0029](./0029-archipielago-in-repo-isolation.md)); the table is still
**generated from host UI folders** and should stay **visible under the host**
so authors can debug “new island folder but SSR/hydrate ignores it.”
[ADR-0028](./0028-island-filesystem-manifest.md) fixed registration on
filesystem discovery + sync, but baked in sample policy: a fixed
`protocol/islands.generated.ts` path and **gitignored** regen. Embedders need
a host config file for path overrides and a choice between auto sync and
hand-owned maps—without relaxing the conventional folder layout yet
([ADR-0025](./0025-per-component-folders.md)).

## Decision

- **Host config file:** repo-root `archipielago.config.ts` exports
  `ArchipielagoUserConfig` (`paths` partial + `islands.registration`). Sync and
  scaffold load it via `loadAndApplyArchipielagoConfig`. In-process tests may
  call `applyArchipielagoUserConfig` / `resetArchipielagoConfig`.
- **Registration modes** (source of truth for the **table**, not folder shape):
  - **`filesystem`** (sample default) — walk `islandsDirRel`; `pnpm islands:sync`
    writes `islandsGeneratedRel`; scaffold runs sync after creating an island.
  - **`manifest`** — host owns the map file; sync **refuses to write**; scaffold
    creates the conventional folder and **warns** with the exact entry to add.
- **Conventional folders remain required** in both modes:
  `ui/islands/<name>/<name>.tsx` (+ optional `<name>.module.scss`). No alternate
  island layouts in this ADR.
- **Gitignore is host policy**, not package law. This sample may gitignore the
  generated map; other hosts may commit it (especially on `manifest`).
- **Static inject import:** changing `paths.islandsGeneratedRel` still requires
  updating the app’s `registerIslands` import (config cannot redirect TypeScript
  specifiers alone). Document that next to the config file.

Amends tooling/docs expectations from [ADR-0028](./0028-island-filesystem-manifest.md)
(fixed path + mandated gitignore). Folder discovery and glob loaders from 0028
remain.

## Consequences

- Authors pick auto vs manual UI registration in one config value; tools branch
  on it; engines stay mode-agnostic (`registerIslands` / `getIslands`).
- Hosts on `manifest` must drop `islands:sync` from lifecycle hooks or sync
  fails loudly instead of clobbering the map.
- Path overrides for scan/output dirs are config-driven for tools; Nest path
  getters remain available for engines (`ArchipielagoPaths`).
- Follow-up (out of scope): optional `manifest`↔folder `--check`, relocating the
  inject import via codegen, alternate folder layouts.

## Alternatives considered

- **Keep ADR-0028 sample policy as package invariants** — blocks embedders with
  weak CI or who want a committed map; rejected.
- **Allow non-conventional island folders now** — premature; rejected until a
  later ADR.
- **Sync no-op (exit 0) in manifest mode** — hides misconfigured hooks; rejected
  in favor of refuse-to-write with a clear error.
- **Config-only redirect of the `registerIslands` import** — needs codegen or
  alias tricks; deferred; document manual import update instead.
