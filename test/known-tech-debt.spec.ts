import { createUserSchema } from '../src/user/dto/create-user.dto.js';

/**
 * TD-004 — desired: passwords weaker than a mixed-case + digit rule are rejected.
 * Today only min(8) is required, so this example fails until the schema tightens.
 * If it unexpectedly passes, move the assertion into create-user.dto.spec.ts
 * and remove TD-004 from docs/known-tech-debt.md.
 */
describe('known tech debt', () => {
  it.fails('TD-004: rejects a password that is only lowercase letters and digits', () => {
    const result = createUserSchema.safeParse({
      email: 'ada@example.com',
      username: 'Ada_Lovelace',
      displayName: 'Ada Lovelace',
      password: 'password1',
    });

    expect(result.success).toBe(false);
  });
});
