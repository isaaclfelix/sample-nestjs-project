# ADR-0001: One Nest process for API, SSR, and assets

- **Status:** Accepted
- **Date:** 2026-10-28

## Context

The app needs a JSON API and HTML pages. Splitting into multiple deployables early adds CI, hosting, and language/tooling cost while the team and traffic are small.

## Decision

Run **one Nest process** that serves `/api`, root HTML (SSR), and static/Vite assets.

## Consequences

- One deploy pipeline, one host, one language, shared lint/test tools—without a monorepo or parallel CI.
- The app can split into separate frontends later if success and headcount justify it; that is expected to be a long way off.
- Global Nest middleware (for example logging) applies to both surfaces unless explicitly skipped.

## Alternatives considered

- Separate Next.js (or similar) app — second deploy, CI, and host; extra ops load at this scale.
- Monorepo with parallel frontends — more tooling overhead than needed while the team is small.
