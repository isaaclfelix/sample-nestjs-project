# ADR-0005: PostgreSQL, Prisma 7, and repository port

- **Status:** Accepted
- **Date:** 2026-10-28

## Context

The product is relational (users, sessions, uniqueness rules), not document-oriented. We need a production-shaped server database for Docker/Testcontainers and portfolio signal, with room to grow (JSONB, UUID types, case-insensitive uniqueness, later vector-style search) without migrating engines. HTTP contracts already use Zod; Nest prefers composition and DI over merging vendor types into services.

## Decision

- **PostgreSQL** is the system of record.
- **Prisma 7** owns the database schema (`prisma/schema.prisma` + migrations), CLI (`prisma.config.ts`), and client via `@prisma/adapter-pg`. `prisma generate` writes to `src/generated/prisma` (gitignored).
- **`PrismaService` composes** `PrismaClient` (owns a `client` field); it does not extend it.
- Domain **`User`** is the port type. Controllers/services talk to a **`UserRepository`** port; only **`PrismaUserRepository`** imports generated Prisma types. Mapping lives in `user.mapper.ts`.
- Case-insensitive uniqueness uses Postgres **expression unique indexes** on `LOWER(email)` / `LOWER(username)` in SQL migrations—not Prisma `@@unique` (case-sensitive only / cannot express these indexes).

Zod remains the **HTTP** contract ([ADR-0004](./0004-zod-standard-schema-http.md)).

## Consequences

- Single schema/migrate/seed/client toolchain; typed persistence behind a swappable port for tests and future adapters.
- Fine-tuning at the migration layer when Prisma cannot express a constraint exactly.
- Global Prisma module `$connect`s for the process lifetime even when a request never touches the DB ([TD-012](../known-tech-debt.md)).
- E2E uses Testcontainers ([ADR-0010](./0010-e2e-testcontainers.md)); local manual DB uses Compose + Make.

## Alternatives considered

- **SQLite** — not production-shaped for Docker/Testcontainers / portfolio signal.
- **MySQL** — weaker fit for Nest/ecosystem default and the enterprise adoption context we care about; less natural for our planned JSONB / expression-index / vector path.
- **MongoDB / document DB** — product shape is relational.
- **TypeORM** — decorator-centric Nest default; less aligned with schema-based Zod validation.
- **Drizzle / Kysely / raw `pg`** — SQL-first or manual stacks that would delay the persistence backbone.
- Calling Prisma from services without a port — skips Nest DI/composition preferences and makes swaps/tests harder.
- Prisma `@@unique` alone for email/username — case-sensitive; cannot express `LOWER(...)` indexes.
