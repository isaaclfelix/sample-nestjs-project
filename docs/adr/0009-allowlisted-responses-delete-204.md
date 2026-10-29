# ADR-0009: Allowlisted user responses and DELETE 204

- **Status:** Accepted
- **Date:** 2026-10-28

## Context

API responses must never leak password hashes. Clients need a stable contract for delete when the id may or may not exist.

## Decision

- Map domain users to public DTOs only via **`toUserResponseDto`** (allowlisted fields: id, email, username, displayName, verified). Controllers/services do not spread persistence rows.
- **`DELETE /api/user/:id` returns 204** whether or not the user existed (intentional no-op delete). That is the contract, not tech debt.

## Consequences

- Password hashes stay off the wire as long as mappers are used.
- No edge response interceptor yet; runtime allowlisting at the boundary is deferred ([TD-007](../known-tech-debt.md)).
- Clients cannot distinguish “deleted” vs “already gone” from status alone.

## Alternatives considered

- Return full entities / Prisma rows — risk of leaking hashes and internal fields.
- 404 on missing delete — different contract; we chose idempotent 204 instead.
- Edge serializer interceptor now — deferred as TD-007 while mapper-only is sufficient.
