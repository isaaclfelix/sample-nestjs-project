import { z } from 'zod';
import type { SchemaObject } from '@nestjs/swagger';

/**
 * Converts a Zod schema into an OpenAPI 3.0 Schema Object for Swagger responses.
 *
 * Uses the schema's output shape so documented responses match what handlers return
 * after transforms. Shared by controllers that annotate `@ApiOkResponse` / similar.
 *
 * @param {z.ZodType} schema - Any Zod schema describing a response body (or item).
 * @returns {SchemaObject} OpenAPI 3.0 schema suitable for `@Api*Response({ schema })`.
 */
export function toOpenApiSchema(schema: z.ZodType): SchemaObject {
  // Target OpenAPI 3.0 so Swagger UI gets nullable/format conventions Nest expects.
  return z.toJSONSchema(schema, {
    target: 'openapi-3.0',
    io: 'output',
  }) as SchemaObject;
}
