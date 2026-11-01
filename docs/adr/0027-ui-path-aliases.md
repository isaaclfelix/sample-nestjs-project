# ADR-0027: UI zone path aliases

- **Status:** Accepted
- **Date:** 2026-10-29
- **Tags:** web, typescript, vite, imports

## Context

Per-component folders ([ADR-0025](./0025-per-component-folders.md)) made UI→`protocol` and UI→`api` relatives deep (`../../../`, `../../../../`). Nest emit trees stay shallow and must keep relative **`.js`** under nodenext ([ADR-0024](./0024-dual-import-resolution.md)). Authors need short, stable imports when leaving a product component folder without teaching Nest to emit path aliases.

## Decision

- Declare Vite/UI-only aliases on [tsconfig.web.json](../../examples/nestjs/tsconfig.web.json) (no `baseUrl` — oxlint-tsgolint rejects it; path values are relative `./src/...`):
  - `@ui/*` → `./src/web/ui/*`
  - `@protocol/*` → `./src/web/protocol/*`
  - `@archipielago/*` → `./src/archipielago/*` (engines; [ADR-0029](./0029-archipielago-in-repo-isolation.md))
  - `@api/*` → `./src/api/*`
- Mirror the same aliases in [vite.config.ts](../../examples/nestjs/vite.config.ts), [vitest.shared.ts](../../examples/nestjs/vitest.shared.ts), and Storybook `viteFinal`.
- **Usage rule:** from a product component folder (`ui/{pages,islands,server-components,shared-components}/<name>/`), any import that leaves that folder uses `@ui` / `@protocol` / `@api`. Keep `./…` for same-folder siblings and thin barrels. Non-component UI modules (`hooks/`, `api-fetch/`, `runtime/`) use the same aliases when crossing lanes or into `protocol` / `api`.
- **Do not** use these aliases in Nest-emitted `host/`, `protocol/`, or `api/` sources.
- **`ui/vite-plugins/**`:** keep relative `.js` (Node config graph).
- Aliases are **extensionless** (same as UI relatives).

## Consequences

- Leaving a component folder no longer depends on nesting depth.
- `@api` is intentional for shared DTOs/schemas/constants; `@protocol` for the Nest↔UI wire; `@ui` for other UI lanes (including `api-fetch`).
- Scaffold and how-to must emit aliases when generated imports leave the new folder.

## Alternatives considered

- Generic `@/` → `src/` — blurs Nest vs UI ownership.
- Aliases only for `@ui` — leaves the deepest UI→api/protocol relatives unfixed.
- Aliases in Nest emit graphs — incompatible with nodenext without a runtime path rewriter.
