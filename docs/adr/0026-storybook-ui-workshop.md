# ADR-0026: Storybook as a local UI workshop

- **Status:** Accepted
- **Date:** 2026-10-29
- **Tags:** web, storybook, tooling

## Context

Per-component folders ([ADR-0025](./0025-per-component-folders.md)) left room for colocated `*.stories.tsx`. Authors need a browser UI to browse product components in isolation with shell and forms CSS. Vitest browser mode already owns interaction QA ([ADR-0021](./0021-vitest-browser-ui-testing.md)). Chromatic-style visual regression and hosted PR Storybooks are useful at larger scale but overkill while the UI surface is small and local `pnpm storybook` is enough.

## Decision

- Run **Storybook 10** with `@storybook/react-vite` against Vite 8 / React 19.
- Colocate CSF3 stories under `src/web/ui/{pages,islands,server-components,shared-components}/**/*.stories.tsx`. Thin barrels stay public-only; stories may deep-import private siblings.
- Preview imports `shell.scss` and `forms.scss` and stubs CSRF meta + `fetch` so mutating islands work without Nest.
- Do **not** load product Vite island CSS suppress / shell-budget plugins in Storybook — CSS modules must inject in the canvas.
- Skip stories for `Document` (nested `html`/`body` inside Storybook’s iframe).
- Scripts: `pnpm storybook` (local workshop on port 6006) and `pnpm build-storybook` (CI compile check only).
- No Chromatic, no `@storybook/addon-vitest` as a second test runner. Scaffold emits a minimal story stub for new pages/islands.

## Consequences

- Developers browse the component library locally without starting Nest.
- CI catches broken stories via static Storybook build.
- Visual regression SaaS and hosted PR Storybooks remain optional later tech debt.

## Alternatives considered

- Chromatic / visual review gates — deferred until visual drift reviews are needed.
- Storybook interaction tests replacing Vitest — rejected; ADR-0021 already owns QA.
- Fat story-only barrels / composition APIs — rejected with ADR-0025.
