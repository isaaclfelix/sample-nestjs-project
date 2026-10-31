---
name: create-web-ui
description: >-
  Scaffold Nest SSR pages or interactive islands under src/web/. Use when the
  user asks to add UI, a page section, a component, an island, web styles, or
  “scaffold web UI.” Follows docs/how-to-web-ui.md; refuses CSS-module and
  island-only-for-styling anti-patterns.
---

# Create Web UI

Bootstrap HTML UI in this Nest + Vite islands app **without inventing a parallel CSS or island pattern**. Source of truth for the decision tree: [docs/how-to-web-ui.md](../../../docs/how-to-web-ui.md). Delivery mechanics: [docs/architecture.md](../../../docs/architecture.md) (Styles). Layout: [ADR-0023](../../../docs/adr/0023-web-host-ui-protocol.md) (host / ui / protocol). Relative imports under `src/web/ui/` are **extensionless** ([ADR-0024](../../../docs/adr/0024-dual-import-resolution.md)); do not emit Nest-style `.js` suffixes into UI stubs. Components live in **per-component folders** with thin `index.ts` barrels ([ADR-0025](../../../docs/adr/0025-per-component-folders.md)). Scaffold also emits a colocated Storybook stub ([ADR-0026](../../../docs/adr/0026-storybook-ui-workshop.md)). Imports that leave a component folder use `@ui` / `@protocol` / `@api` ([ADR-0027](../../../docs/adr/0027-ui-path-aliases.md)).

Prefer the shared scaffolder so humans and agents stay aligned:

```bash
pnpm scaffold:web-ui --name <kebab> --mode page|island [--with-styles]
```

Implementation: [scripts/scaffold-web-ui.ts](../../../scripts/scaffold-web-ui.ts). Run that script (or apply the **same** file edits it would). Do not hand-roll a different CSS delivery path. For new islands, follow `archipielago.config.ts` registration mode (auto sync vs manual table entry) — [ADR-0030](../../../docs/adr/0030-archipielago-host-config.md).

## Ask before writing

Unless the user already answered, ask these in order:

1. **Does this need client interactivity** (state, events, browser APIs)?
   - **No** → SSR-only page folder under `src/web/ui/pages/<name>-page/` + SSR props under `src/web/protocol/page-props/`. Shell classes only. **Refuse** `*.module.scss` and `<Island>` “for styling.”
   - **Yes** → island folder under `src/web/ui/islands/<name>/`; then ask (2).
2. **Does it need interaction-specific styles** beyond the shell (hover, spinner, open state)?
   - **No** → island folder only; style with shell classes (`--mode island` without `--with-styles`). Scaffold syncs or warns per config registration mode.
   - **Yes** → also add colocated `*.module.scss`; scaffold writes it and syncs or warns (`--with-styles`).

Map answers to the CLI:

| Answers                        | Command                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| No interactivity               | `pnpm scaffold:web-ui --name … --mode page`                 |
| Interactive, shell styles only | `pnpm scaffold:web-ui --name … --mode island`               |
| Interactive + module styles    | `pnpm scaffold:web-ui --name … --mode island --with-styles` |

## Must refuse / redirect

- **SSR-only + CSS module** — extend the shell, or promote to an island because it will gain interaction. Never `--mode page --with-styles`.
- **Island only to attach CSS** (no interactive JS) — style with the shell; do not wrap static markup in `<Island>`.
- Re-importing shell / Bootstrap **component** SCSS into an island module (tokens-only via `ui/styles/_tokens.scss`).
- Growing a utility layer or mini-Bootstrap inside island modules.
- A second CSS delivery path (head links per island, CSS only after chunk load, skipping sibling `<style>` inlining).
- Shipping the Bootstrap Icons webfont, or pasting one-off SVGs into an island — register glyphs in `src/web/ui/shared-components/icon/` instead ([how-to-web-ui.md § Icons](../../../docs/how-to-web-ui.md#icons)).
- Putting Nest SSR props beside the page under `ui/pages/` (use `protocol/page-props/*-page.ssr-props.ts`).
- Fat composition barrels or component-as-only-`index.tsx`.

## After scaffolding

**Page:** scaffolder writes `protocol/page-props/<name>-page.ssr-props.ts` (`*PageSsrProps`) + `ui/pages/<name>-page/<name>-page.tsx` + thin `index.ts` + `*.stories.tsx` stub. Then register in `protocol/page-props/page-props.ts` (`SsrPagePropsMap` / `WebPageName`), `ui/runtime/ssr/entry-server` pages map, and a `WebController` method that imports **SSR props types only** from protocol (never the page `.tsx`). Style with shell classes only. Read the [SSR page props quirk](../../../docs/how-to-web-ui.md#ssr-page-props-quirk).

**Island:** render `<Island name="…" component={…} props={…} />` from a page (directory-import the island barrel; import `Island` from `@archipielago/react/runtime/island/island`). Scaffold writes the conventional folder + stories stub. With `archipielago.config.ts` `islands.registration=auto` (sample default), it runs `pnpm islands:sync`; with `manual`, it warns about adding a map entry and does not sync ([ADR-0030](../../../docs/adr/0030-archipielago-host-config.md)). App bootstrap / hydrate entry inject the table via `registerIslands`; Nest does not read it. Hydrate loaders come from the registry glob. Framework inlines CSS as a sibling `<style data-css-island>`; hydrate loads JS only ([ADR-0028](../../../docs/adr/0028-island-filesystem-manifest.md)). Map the page in thin `ui/runtime/ssr/entry-server.tsx` ([ADR-0029](../../../docs/adr/0029-archipielago-in-repo-isolation.md)).

**Tests ([ADR-0021](../../../docs/adr/0021-vitest-browser-ui-testing.md)):** interactive islands need a co-located `*.spec.ts` in the Vitest browser project (Testing Library). Pages/islands that navigate or call the API also need browser e2e coverage (`*.browser-e2e-spec.ts`). Do not defer that to out-of-repo QA ([TD-026](../../../docs/known-tech-debt.md)).

**Storybook ([ADR-0026](../../../docs/adr/0026-storybook-ui-workshop.md)):** browse stubs with `pnpm storybook`. Workshop only — not a Vitest replacement and not Chromatic.

Run `pnpm lint` (and `pnpm build` if signatures/modules changed) after edits. Commit only when the user asks or AGENTS.md incremental commits applies — use the `create-commit` skill.
