# NestJS example

How [examples/nestjs](../../../examples/nestjs) applies the host-agnostic
steps from [wiring.md](./wiring.md). This page maps concepts onto Nest files; it
does **not** redefine the primitives ([concepts.md](./concepts.md)).

| Wiring step                    | Nest example                                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| Packages                       | `@archipielago/{core,react,vite,nestjs}` in `examples/nestjs/package.json`                      |
| Product UI                     | `examples/nestjs/src/web/ui/**`                                                                 |
| Page props / manifest          | `examples/nestjs/src/web/protocol/**`                                                           |
| Config                         | `examples/nestjs/archipielago.config.ts` (`islands.registration: 'auto'`)                       |
| Register islands + stylesheets | `examples/nestjs/src/web/register-app-islands.ts` (called from `main.ts`)                       |
| Island glob                    | `examples/nestjs/src/web/ui/runtime/island/island-modules.ts` (hydrate entry + Vitest setup)    |
| SSR entry                      | `examples/nestjs/src/web/ui/runtime/ssr/entry-server.tsx`                                       |
| Hydrate entry                  | `examples/nestjs/src/web/ui/runtime/island/hydrate-entry.tsx`                                   |
| Vite                           | `examples/nestjs/vite.config.ts` + Archipielago plugins                                         |
| Mount assets                   | `mountArchipielagoAssets(app)` in `examples/nestjs/src/main.ts`                                 |
| Module / renderer              | `ArchipielagoModule.forRoot({ getPageStylesheets })` in `examples/nestjs/src/web/web.module.ts` |
| Routes → HTML                  | `WebController` → `ArchipielagoViewService.render`                                              |

## Adapter surface

- **`ArchipielagoModule.forRoot(options)`** — provides `ArchipielagoViewService`.
  Pass `getPageStylesheets(page)` so product sheet policy stays in the example
  (`examples/nestjs/src/web/page-stylesheets.ts`).
- **`ArchipielagoViewService.render(page, props, { csrfToken?, pageStylesheets? })`** —
  returns the full document string.
- **`mountArchipielagoAssets(app)`** — static client root in production; Vite
  middleware in development.

Nest types stay out of `@archipielago/core`, `react`, and `vite`.

## Commands (from repo root)

| Task         | Command             |
| ------------ | ------------------- |
| Dev server   | `pnpm start:dev`    |
| Build        | `pnpm build`        |
| Unit tests   | `pnpm test`         |
| E2E          | `pnpm test:e2e`     |
| Islands sync | `pnpm islands:sync` |
| Storybook    | `pnpm storybook`    |

Root scripts filter into `@archipielago/example-nestjs`. Shared lint/format/CI
stay at the monorepo root ([ADR-0032](../../adr/0032-archipielago-pnpm-monorepo.md)).

## Authoring UI in the example

Adding pages and islands: [how-to-web-ui.md](../../how-to-web-ui.md) (paths are
under `examples/nestjs`). Prefer `pnpm scaffold:web-ui` for new UI pieces.
