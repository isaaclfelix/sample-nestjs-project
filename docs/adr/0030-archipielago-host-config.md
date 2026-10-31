# ADR-0030: Archipielago host config and islands registration mode

- **Status:** Accepted
- **Date:** 2026-10-31
- **Tags:** archipielago, islands, tooling

## Context

Archipielago engines consume an injected islands manifest
([ADR-0029](./0029-archipielago-in-repo-isolation.md)); the manifest is still
**generated from host UI folders** and should stay **visible under the host**
so authors can debug “new island folder but SSR/hydrate ignores it.”
[ADR-0028](./0028-island-filesystem-manifest.md) fixed registration on
filesystem discovery + sync, but baked in sample policy: a fixed
`protocol/islands.generated.ts` path and **gitignored** regen. Embedders need
a host config file for path overrides and a choice between auto sync and
hand-owned manifests—without relaxing the conventional folder layout yet
([ADR-0025](./0025-per-component-folders.md)).

## Decision

- **Host config file:** repo-root `archipielago.config.ts` exports
  `ArchipielagoUserConfig` (`paths` partial + `islands.registration`). Sync and
  scaffold load it via `loadAndApplyArchipielagoConfig`. In-process tests may
  call `applyArchipielagoUserConfig` / `resetArchipielagoConfig`.
- **Registration modes** control how the host **maintains** the islands
  manifest that `registerIslands` injects. Engines always consume that
  manifest; they do not branch on this setting:
  - **`auto`** (sample default) — derive the manifest from conventional folders
    under `islandsDirRel`; `pnpm islands:sync` writes `islandsGeneratedRel`;
    scaffold runs sync after creating an island.
  - **`manual`** — host owns the manifest; sync **refuses to write**; scaffold
    creates the conventional folder and **warns** with the exact entry to add.
- **Conventional folders remain required** in both modes:
  `ui/islands/<name>/<name>.tsx` (+ optional `<name>.module.scss`). No alternate
  island layouts in this ADR.
- **Gitignore is host policy**, not package law. This sample may gitignore the
  generated manifest; other hosts may commit it (especially on `manual`).
- **Static inject import:** changing `paths.islandsGeneratedRel` still requires
  updating the app’s `registerIslands` import (config cannot redirect TypeScript
  specifiers alone). Document that next to the config file.

Amends tooling/docs expectations from [ADR-0028](./0028-island-filesystem-manifest.md)
(fixed path + mandated gitignore). Folder discovery and glob loaders from 0028
remain.

## Consequences

- Authors pick auto vs manual manifest maintenance in one config value; tools
  branch on it; engines stay mode-agnostic (`registerIslands` / `getIslands`).
- Hosts on `manual` must drop `islands:sync` from lifecycle hooks or sync
  fails loudly instead of clobbering the manifest.
- Path overrides for scan/output dirs are config-driven for tools; Nest path
  getters remain available for engines (`ArchipielagoPaths`).
- Follow-up (out of scope): optional `manual`↔folder `--check`, relocating the
  inject import via codegen, alternate folder layouts.

## Alternatives considered

- **Keep ADR-0028 sample policy as package invariants** — blocks embedders with
  weak CI or who want a committed manifest; rejected.
- **Allow non-conventional island folders now** — premature; rejected until a
  later ADR.
- **Sync no-op (exit 0) in manual mode** — hides misconfigured hooks; rejected
  in favor of refuse-to-write with a clear error.
- **Config-only redirect of the `registerIslands` import** — needs codegen or
  alias tricks; deferred; document manual import update instead.
- **Name modes `filesystem` / `manifest`** — named authoring inputs rather than
  maintenance workflow; rejected after clarifying that engines always consume
  the injected manifest in both modes (`auto` / `manual` preferred).
