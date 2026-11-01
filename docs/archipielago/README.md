# Archipielago

**Archipielago** is an embeddable islands rendering layer for backend apps that already own routing, auth, and data. It server-renders React pages, hydrates only interactive islands, and plugs into the host through thin adapters.

The product name honors Spanish (_archipiélago_) but **drops the accent**—Archipielago, not Archipiélago—so it reads as an international product name rather than a literal dictionary word. Do not introduce other Spanish brand words; kinship labels in the vision (mother, father, Godfather) stay English.

This repository is the **Archipielago monorepo**: framework packages under `packages/*`, runnable host examples (NestJS under `examples/nestjs`), shared tooling, and eventually the public site—which dogfoods Archipielago itself. **Documentation’s home and source of truth remain in this repo** (see [mission.md](./mission.md)).

| Doc                                      | Purpose                                                            |
| ---------------------------------------- | ------------------------------------------------------------------ |
| [mission.md](./mission.md)               | Human-first AI assist, developer-first OSS, community standards    |
| [workflow.md](./workflow.md)             | Recommended AI-assisted flow; mandatory ADR / tech-debt guidelines |
| [vision.md](./vision.md)                 | Philosophy, market position, ownership split, monorepo, non-goals  |
| [roadmap.md](./roadmap.md)               | Long-term phases from isolation through parity and differentiation |
| [guide/concepts.md](./guide/concepts.md) | Host-agnostic primitives and ownership split                       |
| [guide/install.md](./guide/install.md)   | Workspace install today; future `0.0.1` publish                    |
| [guide/wiring.md](./guide/wiring.md)     | Ordered host-agnostic integration steps                            |
| [guide/nestjs.md](./guide/nestjs.md)     | Nest example mapped onto those steps                               |

Layout: `@archipielago/{core,react,vite,nestjs}` in `packages/*`; Nest host in `examples/nestjs` ([ADR-0032](../adr/0032-archipielago-pnpm-monorepo.md)). Current-state map: [architecture.md](../architecture.md). How-to authoring in the Nest example: [how-to-web-ui.md](../how-to-web-ui.md). Durable decisions: [docs/adr/](../adr/README.md).
