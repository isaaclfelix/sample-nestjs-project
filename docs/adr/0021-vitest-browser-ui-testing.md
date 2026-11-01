# ADR-0021: Vitest browser UI testing and in-repo QA ownership

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

HTTP e2e (supertest + Testcontainers) covered API contracts and scraped CSRF from HTML, but product React islands (`.tsx`) were excluded from coverage and form UI states / auth redirects were not exercised in a real browser ([TD-025](../known-tech-debt.md)). We needed parity with the rest of the app before growing more UI, without introducing a second test framework or waiting on a separate QA organization.

## Decision

### Tooling

- **Vitest** remains the single test runner.
- **UI unit tests** run in Vitest **browser mode** with the Playwright **provider** (`@vitest/browser-playwright`), sibling config [`vitest.config.browser.ts`](../../examples/nestjs/vitest.config.browser.ts), composed into the default unit workspace via `test.projects`.
- **Browser e2e journeys** run as Vitest Node tests using the Playwright **library** (`playwright`) against Nest + Testcontainers + Vite middleware, sibling [`vitest.config.browser-e2e.ts`](../../examples/nestjs/vitest.config.browser-e2e.ts) under the e2e workspace. Do **not** add `@playwright/test` as a second runner.
- Component helpers: `@testing-library/react`, `@testing-library/user-event`, and `@testing-library/jest-dom` via `@testing-library/jest-dom/vitest` (extends Vitest `expect`; the Jest runner is not a dependency).
- Remove **happy-dom**; DOM unit specs use the browser project.
- Nest + Testcontainers stay **out** of the default unit projects.
- **Coverage:** unit (+ browser UI unit) V8 thresholds include product `.tsx` under `pages/`, `islands/`, `server-components/`, and `shared-components/`. HTTP and browser e2e are behavioral gates only — do not merge e2e into the coverage percentage.

### In-repo QA ownership

- **This repository owns** automated proof that this app’s shipped UI and API behave correctly: Node unit, browser UI unit, HTTP e2e, and browser e2e for every shipped user path (including auth redirects). If changing `src/` can break it, it belongs in this repo’s CI. Grow those suites with the product; do not wait for out-of-repo tooling.
- **This repository does not own** enterprise QA-org practices: separate Cucumber/BDD repositories, page-object frameworks as a parallel suite, visual / multi-browser release matrices, or cross-system / staging sign-off automation. Those are evaluated only when a QA function or multi-system release process needs them ([TD-026](../known-tech-debt.md)).

## Consequences

- Authors add co-located browser unit specs for interactive islands/pages and browser e2e when a path navigates or mutates.
- CI installs Chromium for unit browser mode and browser e2e; e2e remains a required check.
- [TD-025](../known-tech-debt.md) is closed; optional org-scale QA is tracked as [TD-026](../known-tech-debt.md).
- Naming caveats (V8 vs “Istanbul”, jest-dom vs Jest) live in [testing-and-coverage.md](../testing-and-coverage.md).

## Alternatives considered

- **happy-dom for UI units** — fewer deps and faster, but simulated DOM; rejected for authenticity once Playwright is already required for journeys.
- **Defer browser e2e until a QA team / Cucumber repo exists** — leaves shipped paths unenforced in CI; rejected.
- **Fold org-scale QA (BDD, visual matrices, out-of-repo suites) into this repo now** — wrong ownership and premature; deferred as TD-026.
- **`@playwright/test` as a second runner** — splits ownership and config; rejected in favor of Playwright as Vitest provider/library only.
