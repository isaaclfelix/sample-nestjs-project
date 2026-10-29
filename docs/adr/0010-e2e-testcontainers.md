# ADR-0010: E2E database via Testcontainers

- **Status:** Accepted
- **Date:** 2026-10-28

## Context

E2E boots `AppModule` against real Postgres. Local Compose is fine for manual development but is a poor shared fixture for CI and isolated test runs.

## Decision

Use **Testcontainers** Postgres for e2e (`postgres:16-alpine`), not Compose. Migrate deploy **once** per `pnpm test:e2e` run; **truncate** tables between tests.

## Consequences

- E2E needs Docker available.
- Manual local DB remains Compose + Make ([architecture.md](../architecture.md#persistence)).
- Suites stay isolated without resetting the whole Compose volume each test.

## Alternatives considered

- Compose Postgres for e2e — harder to isolate cleanly in CI; couples developer manual DB to test lifecycle.
- In-memory / mocked DB for e2e — would not exercise real SQL, migrations, or expression indexes.
