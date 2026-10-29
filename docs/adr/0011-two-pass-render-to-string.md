# ADR-0011: Two-pass renderToString SSR

- **Status:** Accepted
- **Date:** 2026-10-28

## Context

Pages need island names before asset tags can be emitted. Streaming SSR would change the contract for how Nest returns HTML today.

## Decision

Render with **two passes of `renderToString`**. Pass 1 collects island names; pass 2 wraps `Document` and emits markers plus assets. **Streaming SSR is not the contract.**

## Consequences

- `createAssets(names)` can emit hydrate scripts only when islands exist.
- Pages with no islands skip the hydrate entry.
- Below-the-fold / streaming hydration improvements remain deferred ([TD-010](../known-tech-debt.md)).

## Alternatives considered

- Streaming SSR as the default contract — more complexity than needed for current pages.
- Single pass without collecting island names — cannot size scripts/styles to used islands accurately.
