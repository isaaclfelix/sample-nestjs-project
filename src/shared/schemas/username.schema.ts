import { z } from 'zod';

/**
 * Shared username rules for API and web validation.
 *
 * Trims input, strips a leading `@`, then requires 3–20 characters starting
 * with a letter and containing only letters, numbers, and underscores.
 * Callers compose this into HTTP DTOs or form schemas.
 */
export const usernameSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/^@/, ''))
  .pipe(
    z
      .string()
      .min(3)
      .max(20)
      .regex(
        /^[a-zA-Z][a-zA-Z0-9_]*$/,
        'Must start with a letter and contain only letters, numbers, and underscores',
      ),
  )
  .meta({ example: 'ada' });

/** Inferred username string after {@link usernameSchema} validation. */
export type Username = z.infer<typeof usernameSchema>;
