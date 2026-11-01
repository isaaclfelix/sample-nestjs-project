# Archipielago roadmap

High-level milestones only. Later phases wait on earlier ones. Outcomes, not sprint tickets. See [vision.md](./vision.md) for product philosophy, [mission.md](./mission.md) for how we operate, and [workflow.md](./workflow.md) for the recommended contribution flow.

| Phase   | Name                                | Status                                                       |
| ------- | ----------------------------------- | ------------------------------------------------------------ |
| 0       | Name and intent                     | Done                                                         |
| 1       | In-repo isolation                   | Done                                                         |
| 2       | Monorepo packages + NestJS consumer | Done ([ADR-0032](../adr/0032-archipielago-pnpm-monorepo.md)) |
| Publish | First npm publish (`0.0.1`)         | Not started (after Phase 2; prefer after Phase 3)            |
| 3       | Host-adapter proof                  | Not started                                                  |
| 4       | Parent parity                       | Not started                                                  |
| 5       | Docs site (dogfood Archipielago)    | Not started                                                  |
| 6       | Differentiation                     | Not started                                                  |

## Phase 0 — Name and intent

- Brand **Archipielago** (no accent; only Spanish product name) and market position written down.
- Kinship labels in English: Astro mother, is-land father, NestJS Godfather (philosophy only).
- Mission recorded: human-first AI assist, developer-first OSS, diversity/inclusion with objective contribution standards.
- Documentation home and source of truth stays in the code repository (agent-friendly; developer-aimed).
- Recommended AI-assisted workflow documented (conversation → plan → execute → review → merge); Cursor today, other environments welcome.
- Hard guideline: ADRs mandatory for locked durable decisions; known tech debt from trade-offs highly encouraged / required once recognized.
- Monorepo destination and dogfooding site claim recorded in vision.
- Rendering-contract principle recorded as a design rule (not a shipped API).

## Phase 1 — In-repo isolation

- Engines under `src/archipielago/{core,host,react,vite}`; Nest product under `src/web/` ([ADR-0029](../adr/0029-archipielago-in-repo-isolation.md)).
- Parameterize roots via `ArchipielagoPaths`; inject product page map + Document in thin `entry-server`.
- NestJS-only surface stays thin: `web-view.service.ts`, `web.controller.ts`, `web.module.ts`, plus product pages, islands, and document.
- Page prop maps stay app-owned under `src/web/protocol/page-props/`.
- Thin orchestration: `render → RenderResult { html, assets }` (full document) with **no NestJS types inside that seam**; Nest view service returns `html`.
- Vite bootstrap via `createDevAssetPipeline`; Nest `main.ts` only mounts.
- No pnpm workspace packages yet (Phase 2).

## Phase 2 — Monorepo packages + NestJS consumer

- This repository becomes an Archipielago **pnpm monorepo**: framework packages, shared tooling (Vite, oxlint, etc.), and a NestJS host example that depends on those packages ([ADR-0032](../adr/0032-archipielago-pnpm-monorepo.md)).
- Package IDs: `@archipielago/core`, `@archipielago/react`, `@archipielago/vite`, `@archipielago/nestjs`.
- Host example paths and package ids use **`nestjs`** (respect the framework’s name)—not “Godfather” or other nicknames. Nest sample lives under `examples/nestjs`.
- Published surface starts minimal (workspace packages with explicit `exports` / peers); **npm registry publish is deferred** to the Publish milestone below.
- NestJS adapter is the first proof that HTTP and DI live outside core.
- Shared tooling stays workspace-owned so host examples and packages do not fork lint/build stacks.

## Publish — First npm publish (`0.0.1`)

- After Phase 2 workspace packages exist and stay publish-ready (clean `exports`, peers, no reverse example imports).
- Prefer waiting until Phase 3 proves the public `Renderer` → `RenderResult` contract with a second host, so the first public cut is not Nest-shaped by accident.
- Does **not** block starting Phase 3. Version target: **`0.0.1`** for the `@archipielago/*` packages that form the public surface.
- Out of Phase 2 scope: Changesets, publish CI, and registry org setup beyond the `@archipielago` name already used in the workspace.

## Phase 3 — Host-adapter proof

- Same UI artifacts render through a second non-monopolizing host example in the monorepo (Express or Hono preferred) without changing pages, islands, or hydrate core.
- Public `Renderer` → `RenderResult` contract is refined from real second-host friction; that is when the integration boundary counts as **proven**.

## Phase 4 — Parent parity

Level the field on Archipielago’s axis. Checklist (targets, not commitments to clone Astro’s app model):

**vs is-land**

- [ ] Documented SSR + selective hydration story (not hydrate-only)
- [ ] Documented asset / CSS pipeline for island documents
- [ ] NestJS-first host adapter DX
- [ ] At least one additional host adapter documented

**vs Astro (learn, don’t clone)**

- [ ] Clearer island registration / author DX where it fits an embeddable library
- [ ] Hydrate timing controls (e.g. load / idle / visible-class behavior) if they stay host-agnostic
- [ ] Asset and manifest polish comparable to what authors need when the backend owns the app

No commitment to ship Astro’s routing, content collections, or multi-framework app shell.

## Phase 5 — Docs site (dogfood Archipielago)

- Evolve the monorepo’s public site into Archipielago’s documentation and marketing surface (philosophy, how-to, metrics, integration guides), **rendered from** in-repo docs—the repository stays the source of truth.
- **Bold claim:** the site is built with Archipielago.
- NestJS may remain the site host; that selection is independent of the Godfather metaphor and can be expanded in a later note.
- Keep a working NestJS (and other) host demos alongside or linked from the site.

## Phase 6 — Differentiation

Placeholder only. Novel product ideas ship **after** Phase 4 parity. Decide the bets then; do not invent them in this document.
