# Archipielago roadmap

High-level milestones only. Later phases wait on earlier ones. Outcomes, not sprint tickets. See [vision.md](./vision.md) for philosophy.

| Phase | Name                                | Status                      |
| ----- | ----------------------------------- | --------------------------- |
| 0     | Name and intent                     | In progress (this docs set) |
| 1     | In-repo isolation                   | Not started                 |
| 2     | Monorepo packages + NestJS consumer | Not started                 |
| 3     | Host-adapter proof                  | Not started                 |
| 4     | Parent parity                       | Not started                 |
| 5     | Docs site (dogfood Archipielago)    | Not started                 |
| 6     | Differentiation                     | Not started                 |

## Phase 0 — Name and intent

- Brand **Archipielago** (no accent; only Spanish product name) and market position written down.
- Kinship labels in English: Astro mother, is-land father, NestJS Godfather (philosophy only).
- Monorepo destination and dogfooding site claim recorded in vision.
- Rendering-contract principle recorded as a design rule (not a shipped API).

## Phase 1 — In-repo isolation

- Parameterize hardcoded paths and product registries in host + SSR entry (`src/web/host/`, `src/web/ui/runtime/`, `src/web/protocol/`).
- NestJS-only surface stays thin: `web-view.service.ts`, `web.controller.ts`, `web.module.ts`, plus product pages, islands, and document.
- Protocol types are host-agnostic; page prop maps stay app-owned.
- Thin in-repo orchestration: `render → { html, assets / island metadata }` with **no NestJS types inside that seam**; the NestJS view service only consumes it.
- ADR when the package/workspace boundary inside this repo is chosen.

## Phase 2 — Monorepo packages + NestJS consumer

- This repository becomes an Archipielago **pnpm monorepo**: framework packages, shared tooling (Vite, oxlint, etc.), and a NestJS host example that depends on those packages.
- Host example paths and package ids use **`nestjs`** (respect the framework’s name)—not “Godfather” or other nicknames.
- Published surface starts minimal: core render contracts, React runtime, Vite helpers, NestJS adapter (exact package names at extraction time).
- NestJS adapter is the first proof that HTTP and DI live outside core.
- Shared tooling stays workspace-owned so host examples and packages do not fork lint/build stacks.

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

- Evolve the monorepo’s public site into Archipielago’s documentation and marketing surface (philosophy, how-to, metrics, integration guides).
- **Bold claim:** the site is built with Archipielago.
- NestJS may remain the site host; that selection is independent of the Godfather metaphor and can be expanded in a later note.
- Keep a working NestJS (and other) host demos alongside or linked from the site.

## Phase 6 — Differentiation

Placeholder only. Novel product ideas ship **after** Phase 4 parity. Decide the bets then; do not invent them in this document.
