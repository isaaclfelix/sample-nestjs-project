import { z } from 'zod';

export const userResponseSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  username: z.string(),
  displayName: z.string(),
  verified: z.boolean(),
});

export type UserResponseDto = z.infer<typeof userResponseSchema>;
