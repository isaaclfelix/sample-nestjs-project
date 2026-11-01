import { z } from 'zod';

/**
 * Shared display-name rules for API and web validation.
 *
 * Trims input and requires 1–50 characters. Callers compose this into HTTP
 * DTOs or form schemas.
 */
export const displayNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .meta({ example: 'Ada Lovelace' });

/** Inferred display name after {@link displayNameSchema} validation. */
export type DisplayName = z.infer<typeof displayNameSchema>;
