import { createUserSchema } from './create-user.dto.js';

const validInput = {
  email: 'ada@example.com',
  username: 'Ada_Lovelace',
  displayName: 'Ada Lovelace',
  password: 'password1',
};

describe('createUserSchema', () => {
  it('accepts a valid payload and preserves username casing', () => {
    const parsed = createUserSchema.parse(validInput);

    expect(parsed).toEqual(validInput);
  });

  it('strips a leading @ from the username', () => {
    const parsed = createUserSchema.parse({
      ...validInput,
      username: '@Ada_Lovelace',
    });

    expect(parsed.username).toBe('Ada_Lovelace');
  });

  it('trims displayName and username', () => {
    const parsed = createUserSchema.parse({
      ...validInput,
      username: '  Ada_Lovelace  ',
      displayName: '  Ada Lovelace  ',
    });

    expect(parsed.username).toBe('Ada_Lovelace');
    expect(parsed.displayName).toBe('Ada Lovelace');
  });

  it('strips unknown fields such as id, verified, and extra keys', () => {
    const parsed = createUserSchema.parse({
      ...validInput,
      id: '00000000-0000-4000-8000-000000000000',
      verified: true,
      role: 'admin',
    });

    expect(parsed).toEqual(validInput);
    expect(parsed).not.toHaveProperty('id');
    expect(parsed).not.toHaveProperty('verified');
    expect(parsed).not.toHaveProperty('role');
  });

  it.each([
    [{ ...validInput, email: 'not-an-email' }, 'email'],
    [{ ...validInput, password: 'short' }, 'password'],
    [{ ...validInput, displayName: '' }, 'displayName'],
    [{ ...validInput, displayName: '   ' }, 'displayName'],
    [{ ...validInput, username: 'ab' }, 'username'],
    [{ ...validInput, username: '1ada' }, 'username'],
    [{ ...validInput, username: 'ada-lovelace' }, 'username'],
    [{ ...validInput, username: 'ada lovelace' }, 'username'],
    [{ ...validInput, username: '@@ada' }, 'username'],
  ])('rejects invalid field in %j', (input) => {
    const result = createUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects a username longer than 20 characters', () => {
    const result = createUserSchema.safeParse({
      ...validInput,
      username: 'a'.repeat(21),
    });

    expect(result.success).toBe(false);
  });

  it('rejects a displayName longer than 50 characters', () => {
    const result = createUserSchema.safeParse({
      ...validInput,
      displayName: 'a'.repeat(51),
    });

    expect(result.success).toBe(false);
  });

  it('rejects a missing required field', () => {
    const { password: _, ...withoutPassword } = validInput;
    const result = createUserSchema.safeParse(withoutPassword);

    expect(result.success).toBe(false);
  });
});
