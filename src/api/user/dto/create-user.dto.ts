import { z } from 'zod';
import { displayNameSchema } from '../../../shared/schemas/display-name.schema.js';
import { emailSchema } from '../../../shared/schemas/email.schema.js';
import { passwordSchema } from '../../../shared/schemas/password.schema.js';
import { usernameSchema } from '../../../shared/schemas/username.schema.js';

export const createUserSchema = z.strictObject({
  email: emailSchema,
  username: usernameSchema,
  displayName: displayNameSchema,
  password: passwordSchema,
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
