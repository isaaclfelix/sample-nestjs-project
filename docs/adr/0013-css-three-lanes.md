# ADR-0013: CSS in three lanes with handpicked Bootstrap

- **Status:** Accepted
- **Date:** 2026-10-28

## Context

Unused CSS hurts Core Web Vitals. PurgeCSS / critical-CSS extract add toolchain risk. Bootstrap’s full stacks are large; not every page needs every component.

## Decision

Ship CSS in **three lanes** without PurgeCSS or critical-CSS extract:

| Lane               | When                         | Role                                                             |
| ------------------ | ---------------------------- | ---------------------------------------------------------------- |
| Shell              | Every HTML page              | Shared layout/content language                                   |
| Page sibling sheet | Pages that opt in            | Shared Bootstrap component CSS that must not tax every page      |
| Island module      | When that island is rendered | Small non-Bootstrap interaction decoration; tokens-only Sass API |

**Shell** handpicks Bootstrap Option B pieces (config/utilities map, root, reboot, type, images, containers, grid, buttons)—**not** forms or other heavy stacks. Compile Sass → PostCSS → Lightning CSS at Baseline Widely Available. Report size vs `SHELL_CSS_BUDGET_BYTES` (default 50 KiB). Production **inlines** shell as `<style>` when raw size ≤ budget; otherwise `<link>`. Development always `<link>` + HMR.

Authoring rules: [how-to-web-ui.md](../how-to-web-ui.md). Forms sibling: [ADR-0014](./0014-forms-sibling-stylesheet.md). Island CSS delivery: [ADR-0015](./0015-island-css-sibling-style.md).

## Consequences

- Unused Bootstrap leaves by handpicking; unused sibling/island CSS never ships if unused.
- Hard fail-on-exceed for the shell budget is deferred ([TD-014](../known-tech-debt.md)).
- Broader browser targets / autoprefixer deferred ([TD-013](../known-tech-debt.md), [TD-015](../known-tech-debt.md)).

## Alternatives considered

- PurgeCSS / critical-CSS extract — extra complexity; handpicking + opt-in covers unused CSS.
- Full Bootstrap in the shell — taxes every page.
- Tailwind-style utility sprawl — rejected for this design system.
- Island-only-for-styling or SSR-only CSS modules — anti-patterns; see how-to-web-ui.
