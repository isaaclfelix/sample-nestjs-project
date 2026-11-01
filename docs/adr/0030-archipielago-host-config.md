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
a host choice between auto sync and hand-owned manifests—without relaxing the
conventional island folder layout yet ([ADR-0025](./0025-per-component-folders.md)).

Nest-sample roots such as `src/web/ui/…` are **host packaging**, not framework
law. Archipielago’s durable convention starts at `ui/islands/<name>/<name>.tsx`
(manifest + glob loaders). Relocating the host mount for a second framework is
a Phase 3 problem ([docs/archipielago/roadmap.md](../archipielago/roadmap.md)).

## Decision

- **Host config file:** repo-root `archipielago.config.ts` exports
  `ArchipielagoUserConfig` with **`islands.registration` only**. Sync and
  scaffold load it via `loadAndApplyArchipielagoConfig`. In-process tests may
  call `applyArchipielagoUserConfig` / `resetArchipielagoConfig`.
- **Registration modes** control how the host **maintains** the islands
  manifest that `registerIslands` injects. Engines always consume that
  manifest; they do not branch on this setting:
  - **`auto`** (sample default) — derive the manifest from conventional folders
    under the Nest-sample `islandsDirRel` default; `pnpm islands:sync` writes
    the default `islandsGeneratedRel`; scaffold runs sync after creating an
    island.
  - **`manual`** — host owns the manifest; sync **refuses to write**; scaffold
    creates the conventional folder and **warns** with the exact entry to add.
- **Conventional island folders remain required** in both modes:
  `ui/islands/<name>/<name>.tsx` (+ optional `<name>.module.scss`). No alternate
  island layouts in this ADR.
- **Path roots** stay Nest-sample defaults in `ArchipielagoPaths`
  (`get`/`setArchipielagoPaths`). Host-facing `paths` in
  `archipielago.config.ts` is **out of scope** until Phase 3 / real second-host
  friction (not part of `ArchipielagoUserConfig` yet).
- **Gitignore is host policy**, not package law. This sample may gitignore the
  generated manifest; other hosts may commit it (especially on `manual`).

Amends tooling/docs expectations from [ADR-0028](./0028-island-filesystem-manifest.md)
(fixed path + mandated gitignore as package law). Folder discovery and glob
loaders from 0028 remain. Supersedes the earlier draft of this ADR that exposed
`paths` partial overrides on the host config file.

## Consequences

- Authors pick auto vs manual manifest maintenance in one config value; tools
  branch on it; engines stay mode-agnostic (`registerIslands` / `getIslands`).
- Hosts on `manual` must drop `islands:sync` from lifecycle hooks or sync
  fails loudly instead of clobbering the manifest.
- Sync/scaffold continue to read Nest-sample path defaults; tests may still
  call `setArchipielagoPaths` without a public config knob.
- Follow-up (out of scope): host-facing path overrides for non-`src/web` mounts
  (Phase 3), optional `manual`↔folder `--check`, inject-import codegen,
  alternate island layouts.
- Phase 2 ([ADR-0032](./0032-archipielago-pnpm-monorepo.md)) moves this host
  config with the Nest example under `examples/nestjs` and injects path roots
  into `@archipielago/*` package APIs. Host-facing `paths` on
  `ArchipielagoUserConfig` remains deferred until second-host friction unless
  injection alone is insufficient for the Nest example move.

## Alternatives considered

- **Keep ADR-0028 sample policy as package invariants** — blocks embedders with
  weak CI or who want a committed manifest; rejected.
- **Allow non-conventional island folders now** — premature; rejected until a
  later ADR.
- **Sync no-op (exit 0) in manual mode** — hides misconfigured hooks; rejected
  in favor of refuse-to-write with a clear error.
- **Host-facing `paths` overrides in this ADR** — useful eventually for other
  hosts, but couples sync/scaffold to roots the static `registerIslands` import
  cannot follow, and overshoots Phase 1 (Nest-only sample). Deferred to Phase 3.
- **Name modes `filesystem` / `manifest`** — named authoring inputs rather than
  maintenance workflow; rejected after clarifying that engines always consume
  the injected manifest in both modes (`auto` / `manual` preferred).
