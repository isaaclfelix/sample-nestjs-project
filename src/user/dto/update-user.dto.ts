import { z } from 'zod';
import { createUserSchema } from './create-user.dto.js';

export const updateUserSchema = createUserSchema
  .omit({ email: true, username: true })
  .partial()
  .strict()
  .refine(
    (body) => body.displayName !== undefined || body.password !== undefined,
    { message: 'At least one of displayName or password is required' },
  );

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
