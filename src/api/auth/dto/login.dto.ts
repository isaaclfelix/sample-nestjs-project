import { z } from 'zod';
import { passwordSchema } from '../../../shared/password.schema.js';

export const loginSchema = z.strictObject({
  identifier: z.string().trim().min(1).meta({
    description: 'Email or username',
    example: 'ada@example.com',
  }),
  password: passwordSchema,
});

export type LoginDto = z.infer<typeof loginSchema>;
