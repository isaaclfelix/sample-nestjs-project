---
name: create-web-ui
description: >-
  Scaffold Nest SSR pages or interactive islands under src/web/. Use when the
  user asks to add UI, a page section, a component, an island, web styles, or
  “scaffold web UI.” Follows docs/how-to-web-ui.md; refuses CSS-module and
  island-only-for-styling anti-patterns.
---

# Create Web UI

Bootstrap HTML UI in this Nest + Vite islands app **without inventing a parallel CSS or island pattern**. Source of truth for the decision tree: [docs/how-to-web-ui.md](../../../docs/how-to-web-ui.md). Delivery mechanics: [docs/architecture.md](../../../docs/architecture.md) (Styles).

Prefer the shared scaffolder so humans and agents stay aligned:

```bash
pnpm scaffold:web-ui --name <kebab> --mode page|island [--with-styles]
```

Implementation: [scripts/scaffold-web-ui.ts](../../../scripts/scaffold-web-ui.ts). Run that script (or apply the **same** file edits it would). Do not hand-roll a different registry or CSS delivery path.

## Ask before writing

Unless the user already answered, ask these in order:

1. **Does this need client interactivity** (state, events, browser APIs)?
   - **No** → SSR-only page / presentational child under `src/web/pages/`. Shell classes only. **Refuse** `*.module.scss` and `<Island>` “for styling.”
   - **Yes** → island under `src/web/islands/`; then ask (2).
2. **Does it need interaction-specific styles** beyond the shell (hover, spinner, open state)?
   - **No** → island + registry; style with shell classes only (`--mode island` without `--with-styles`).
   - **Yes** → also add a small `*.module.scss` and `cssModulePath` (`--with-styles`).

Map answers to the CLI:

| Answers                        | Command                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| No interactivity               | `pnpm scaffold:web-ui --name … --mode page`                 |
| Interactive, shell styles only | `pnpm scaffold:web-ui --name … --mode island`               |
| Interactive + module styles    | `pnpm scaffold:web-ui --name … --mode island --with-styles` |

## Must refuse / redirect

- **SSR-only + CSS module** — extend the shell, or promote to an island because it will gain interaction. Never `--mode page --with-styles`.
- **Island only to attach CSS** (no interactive JS) — style with the shell; do not wrap static markup in `<Island>`.
- Re-importing shell / Bootstrap **component** SCSS into an island module (tokens-only via `styles/_tokens.scss`).
- Growing a utility layer or mini-Bootstrap inside island modules.
- A second CSS delivery path (head links per island, CSS only after chunk load, skipping sibling `<style>` inlining).
- Shipping the Bootstrap Icons webfont, or pasting one-off SVGs into an island — register glyphs in `src/web/shared-components/icon.tsx` instead ([how-to-web-ui.md § Icons](../../../docs/how-to-web-ui.md#icons)).

## After scaffolding

**Page:** scaffolder writes `<name>-page.props.ts` + `<name>-page.tsx`. Then register in `page-props.ts` (`PagePropsMap` / `WebPageName`), `runtime/ssr/entry-server` pages map, and a `WebController` method that imports **props types only** (never the page `.tsx`). Style with shell classes only.

**Island:** render `<Island name="…" component={…} props={…} />` from a page (import `Island` from `src/web/runtime/island/island`). Register in `runtime/island/registry.ts`. Framework inlines CSS as a sibling `<style data-css-island>` when `cssModulePath` is set; hydrate loads JS only.

**Tests ([ADR-0021](../../../docs/adr/0021-vitest-browser-ui-testing.md)):** interactive islands need a co-located `*.spec.ts` in the Vitest browser project (Testing Library). Pages/islands that navigate or call the API also need browser e2e coverage (`*.browser-e2e-spec.ts`). Do not defer that to out-of-repo QA ([TD-026](../../../docs/known-tech-debt.md)).

Run `pnpm lint` (and `pnpm build` if signatures/modules changed) after edits. Commit only when the user asks or AGENTS.md incremental commits applies — use the `create-commit` skill.
