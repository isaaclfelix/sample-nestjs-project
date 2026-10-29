# ADR-0007: Guest signup and owner-only user mutations

- **Status:** Accepted
- **Date:** 2026-10-28

## Context

User creation is public signup. Updates and deletes must not be anonymous or cross-user. A public list endpoint was not needed for the current product surface.

## Decision

- `POST /api/user` is **guest signup** (CSRF + rate limit; no session ownership required).
- `PATCH` / `DELETE /api/user/:id` require an **authenticated session** and **ownership** of `:id` (401 / 403 as appropriate).
- Retire the **public list** endpoint.

## Consequences

- Register UI can create accounts without being logged in; profile mutations wait for login.
- Profile / self-service UI remains deferred ([TD-024](../known-tech-debt.md)).
- Verified-email gate before login is deferred ([TD-022](../known-tech-debt.md)).

## Alternatives considered

- Require login before any user create — blocks guest registration flow.
- Keep a public user list — unnecessary exposure for current product needs.
