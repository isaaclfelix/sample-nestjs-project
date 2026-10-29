# ADR-0014: Forms as shared opt-in sibling stylesheet

- **Status:** Accepted
- **Date:** 2026-10-28

## Context

Full Bootstrap forms were audited as large, so forms stayed out of the shell. Not every page needs forms. Putting resting or validation form CSS on islands would violate “no island only to ship CSS.” Splitting validation onto islands looked attractive for “interaction CSS,” but Bootstrap `validation` is only ~1.2 KiB gzip and wiring Bootstrap into CSS modules is more complex than the download win.

## Decision

One shared **opt-in sibling** sheet `src/web/styles/forms.scss` (Vite input `forms`). Pages list `'forms'` in `pageStylesheetsByPage`; `createPageAssets` emits a head `<link>`. Import selective Bootstrap partials only: `forms/labels`, `forms/form-control`, `forms/form-text`, `forms/validation`—not the full forms barrel.

Accept some unused selectors inside those partials at current size (~11 KiB raw / ~2 KiB gzip) rather than forking like `_buttons.scss` or building per-page subsets. Login and register share one sheet.

## Consequences

- Form pages pay for forms CSS; other pages do not.
- Validation CSS ships before JS toggles classes; markup can stay initial-state until validation UI lands.
- Revisit when sibling raw ≳16 KiB, clear per-page divergence (>3 KiB gzip unused vs another form page), or a buttons-style allowlist is worth it ([TD-021](../known-tech-debt.md)).
- Do not re-import CSS-emitting Bootstrap form partials into island modules ([TD-016](../known-tech-debt.md)).

## Alternatives considered

- Forms in the shell — taxes every page.
- Island-only-for-CSS or validation-only on islands — anti-pattern / poor size tradeoff.
- Full Bootstrap forms barrel — larger than needed.
- Bootstrap form partials inside island CSS modules — rejected.
