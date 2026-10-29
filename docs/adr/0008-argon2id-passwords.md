# ADR-0008: Argon2id password hashing

- **Status:** Accepted
- **Date:** 2026-10-28

## Context

User passwords must never be stored as plaintext. Hashing should maximize cost for offline cracking. bcrypt remains strong; Argon2id is the stronger modern default.

## Decision

Hash passwords with **Argon2id** via a shared helper (`src/api/common/password.ts`). The encoded string carries algorithm, cost parameters, salt, and hash. Seed and runtime import the same helper so hashing does not drift.

## Consequences

- Higher resistance to offline attacks than bcrypt at comparable intent.
- Cost parameters are **constants** today; loading them from config is deferred ([TD-005](../known-tech-debt.md)).

## Alternatives considered

- bcrypt — still strong, but Argon2id is the newer, stronger competitor for the same goal.
- Plaintext or reversible encryption — unacceptable for password storage.
