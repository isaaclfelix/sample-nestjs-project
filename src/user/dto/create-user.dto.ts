import { z } from 'zod';

const usernameSchema = z
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
  );

export const createUserSchema = z.object({
  email: z.email(),
  username: usernameSchema,
  displayName: z.string().trim().min(1).max(50),
  password: z.string().min(8),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
