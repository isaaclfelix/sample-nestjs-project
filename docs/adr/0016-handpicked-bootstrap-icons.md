# ADR-0016: Handpicked Bootstrap Icons SVGs

- **Status:** Accepted
- **Date:** 2026-10-28

## Context

UI needs a small set of icons without shipping an entire icon webfont or one-off pasted SVGs across the tree.

## Decision

Handpick [Bootstrap Icons](https://icons.getbootstrap.com/) SVGs into `src/web/shared-components/icon.tsx` and render `<Icon name="…" />` from server-components or islands. Add a glyph to that file when a new icon is needed. No icon font package.

Authoring steps: [how-to-web-ui.md](../how-to-web-ui.md#icons).

## Consequences

- Only used glyphs ship with the React tree.
- Contributors follow one registry instead of ad-hoc SVGs.

## Alternatives considered

- Bootstrap Icons webfont package — large download for few glyphs.
- One-off inline SVGs per call site — inconsistent and hard to maintain.
