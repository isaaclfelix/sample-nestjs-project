# ADR-0004: Zod and StandardSchemaValidationPipe as HTTP contract

- **Status:** Accepted
- **Date:** 2026-10-28

## Context

HTTP bodies and params need a single source of truth for validation, TypeScript types, and OpenAPI. Nest’s traditional path leans on class-validator / decorated DTO classes; the ecosystem (and Nest) are moving toward schema-based validation with Zod support.

## Decision

Use **Zod** schemas as the HTTP contract. Install **`StandardSchemaValidationPipe`** globally; pass schemas on `@Body` / `@Param` decorators. Derive TypeScript types with `z.infer`. Generate OpenAPI response/request shapes from Zod (`z.toJSONSchema`, …) after the pipe is installed so docs match runtime validation. Exclude web controllers from the OpenAPI document.

## Consequences

- One schema drives runtime 400s, TS types, and Swagger shapes.
- Shared pieces (e.g. `passwordSchema`) live under `src/shared/schemas/` for API and islands.
- Swagger UI / raw specs are served in every environment today while the app is local-only; protecting or disabling them when deployed is **[TD-006](../known-tech-debt.md)**—not an accepted “public docs forever” decision.

## Alternatives considered

- class-validator + decorated DTO classes — Nest’s older default; less aligned with schema-first Zod and our OpenAPI generation path.
- Hand-written OpenAPI separate from runtime validation — docs drift from behavior.
