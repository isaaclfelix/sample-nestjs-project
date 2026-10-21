import { z } from 'zod';
import { createUserSchema } from './create-user.dto.js';

export const updateUserSchema = createUserSchema
  .omit({ email: true, username: true })
  .partial();

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
