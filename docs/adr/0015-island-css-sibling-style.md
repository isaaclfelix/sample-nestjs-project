# ADR-0015: Island CSS as SSR sibling style tags

- **Status:** Accepted
- **Date:** 2026-10-28

## Context

Island CSS modules must style SSR HTML without FOUC and without double delivery after hydrate. Leaving CSS only on the JS chunk delays paint until the chunk loads.

## Decision

Keep the CSS module import on the island component for hashed classes and the Vite graph, but **deliver** CSS as a framework-owned sibling `<style data-css-island="{name}">` above the marker (once per name per page) after SSR pass 1 collects names. Hydrate loads **JS only**: production filters `.css` URLs out of `__vite__mapDeps` preload results (without removing array entries); development rewrites Vite `updateStyle` to update the sibling tag instead of injecting a second head style.

## Consequences

- No FOUC for SSR islands; no head dump of every island sheet; no double CSS delivery.
- Below-the-fold island **JS** hydration timing remains [TD-010](../known-tech-debt.md); CSS for used islands is already in the HTML.

## Alternatives considered

- Head `<link>` per island — more requests; worse for small modules.
- CSS only after chunk load — FOUC on SSR HTML.
- Leaving mapDeps CSS preloads — double delivery with sibling styles.
