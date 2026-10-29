# ADR-0006: Cookie sessions and CSRF for first-party browser UI

- **Status:** Accepted
- **Date:** 2026-10-28

## Context

Mutating API calls from the browser need an authenticated session and CSRF protection. There are **no external non-browser API consumers** today; the product is first-party HTML + islands calling same-origin `/api`.

## Decision

Use **cookie sessions** plus a **CSRF token** (Laravel-style), not client JWTs for this UI:

- Session middleware loads or creates a guest session from the HttpOnly `sid` cookie for HTML and `/api` (skip Vite/static asset paths).
- Global `CsrfGuard` requires `X-CSRF-TOKEN` to match the session on mutating `/api` methods.
- SSR embeds `<meta name="csrf-token">`; there is **no** JSON CSRF mint endpoint.
- Login regenerates the session id and attaches `userId`. Session rows live in Postgres (`sessions`).

## Consequences

- Browser and e2e obtain CSRF the same way (load a page, read meta).
- Network / ingress allowlisting so untrusted peers never reach `/api` is separate deferred work ([TD-023](../known-tech-debt.md)), not part of this ADR.
- Non-browser or third-party API clients remain out of scope until a product need appears (then revisit auth).

## Alternatives considered

- Client JWTs in localStorage/headers for first-party UI — worse CSRF/XSS tradeoffs for cookie-capable same-origin browsers; not needed without external API clients.
- JSON CSRF mint endpoint — extra surface; SSR meta matches the real browser path.
