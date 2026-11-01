import { z } from 'zod';
import { toOpenApiSchema } from './openapi-schema.js';
import { userResponseSchema } from '../user/dto/user-response.dto.js';

describe('toOpenApiSchema', () => {
  it('converts an object schema into OpenAPI properties and required fields', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number().int(),
    });

    const openApi = toOpenApiSchema(schema);

    expect(openApi).toMatchObject({
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
      },
      required: ['name', 'age'],
    });
    // OpenAPI 3.0 target omits the JSON Schema $schema keyword.
    expect(openApi).not.toHaveProperty('$schema');
  });

  it('uses the output shape when the schema transforms input', () => {
    const schema = z
      .string()
      .transform((value) => value.length)
      .pipe(z.number());

    expect(toOpenApiSchema(schema)).toMatchObject({ type: 'number' });
  });

  it('documents the public user response fields used by controllers', () => {
    const openApi = toOpenApiSchema(userResponseSchema);

    expect(openApi).toMatchObject({
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        email: { type: 'string', format: 'email' },
        username: { type: 'string' },
        displayName: { type: 'string' },
        verified: { type: 'boolean' },
      },
      required: ['id', 'email', 'username', 'displayName', 'verified'],
    });
  });
});
