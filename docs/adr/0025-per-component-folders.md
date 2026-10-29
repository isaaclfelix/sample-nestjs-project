# ADR-0025: Per-component folders with thin barrels

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

Product UI under `src/web/ui/{pages,islands,server-components,shared-components}/` was flat: each component’s `.tsx`, optional `.module.scss`, and `.spec.ts` sat as siblings in a growing directory. Storybook and further composition would worsen the clutter. We already split Nest host vs Vite UI ([ADR-0023](./0023-web-host-ui-protocol.md)) and dual import styles ([ADR-0024](./0024-dual-import-resolution.md)).

Authors want clean directory imports without fat composition barrels or component-as-only-`index.tsx` (poor searchability). Island hydrate loaders must stay aligned with Vite client-manifest keys.

## Decision

- One **kebab folder per component** under the four product UI trees.
- Implementation file keeps the kebab name (`mobile-navigation/mobile-navigation.tsx`); public surface is a **thin** `index.ts` that re-exports only the public symbol (default or named).
- No composition / escape-hatch / subcomponent barrels. Storybook (later) may deep-import private siblings.
- App code imports the **directory**. Island registry dynamic `import()` and `islandManifestSourceKey` use the **concrete** implementation path via shared helpers (`islandEntryRelPath`, `islandCssModulePath`) so hydrate and host asset delivery cannot drift.
- SSR page props remain in `protocol/page-props/` ([ADR-0023](./0023-web-host-ui-protocol.md)).

## Consequences

- Folders scale when specs, CSS modules, and stories colocate.
- Slightly longer relative paths inside nested files; scaffold and how-to must emit the nested layout.
- Registry deliberately does not import through the thin barrel.

## Alternatives considered

- Component-as-`index.tsx` only — hurts editor search and “open file by name.”
- Fat barrels exporting subcomponents — composition tax we rejected for this Bootstrap-thin UI.
- Flat tree forever — fails once Storybook and multi-file components land.
- Registry importing the barrel — risk of manifest key vs module graph mismatch.
