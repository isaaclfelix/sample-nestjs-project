import { z } from 'zod';

/**
 * Shared email address rules for API and web validation.
 *
 * Callers compose this into HTTP DTOs or form schemas.
 */
export const emailSchema = z.email().meta({
  example: 'ada@example.com',
});

/** Inferred email string after {@link emailSchema} validation. */
export type Email = z.infer<typeof emailSchema>;
