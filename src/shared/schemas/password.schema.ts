import { z } from 'zod';

/**
 * Shared memorized-secret (password) rules for API and web validation.
 *
 * Follows NIST SP 800-63B length guidance: require adequate minimum length,
 * allow long secrets, and avoid mandatory composition rules (mixed case /
 * digits / symbols). Callers compose this into HTTP DTOs or form schemas.
 *
 * @see https://pages.nist.gov/800-63-4/sp800-63b.html
 */
export const passwordSchema = z
  .string()
  .min(12)
  .max(128)
  .meta({ example: 'correct-horse' });

/** Inferred password string after {@link passwordSchema} validation. */
export type Password = z.infer<typeof passwordSchema>;
