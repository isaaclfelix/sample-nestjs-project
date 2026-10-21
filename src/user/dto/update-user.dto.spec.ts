import { updateUserSchema } from './update-user.dto.js';

describe('updateUserSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(updateUserSchema.parse({})).toEqual({});
  });

  it('accepts displayName and/or password independently', () => {
    expect(updateUserSchema.parse({ displayName: 'Ada' })).toEqual({
      displayName: 'Ada',
    });
    expect(updateUserSchema.parse({ password: 'password1' })).toEqual({
      password: 'password1',
    });
  });

  it('strips email and username instead of applying them (current PATCH contract)', () => {
    const parsed = updateUserSchema.parse({
      email: 'new@example.com',
      username: 'new_handle',
      displayName: 'Ada',
    });

    expect(parsed).toEqual({ displayName: 'Ada' });
    expect(parsed).not.toHaveProperty('email');
    expect(parsed).not.toHaveProperty('username');
  });

  it('still enforces create rules on fields that are present', () => {
    expect(updateUserSchema.safeParse({ password: 'short' }).success).toBe(
      false,
    );
    expect(updateUserSchema.safeParse({ displayName: '' }).success).toBe(false);
  });

  it('strips unknown keys rather than rejecting them', () => {
    const parsed = updateUserSchema.parse({
      displayName: 'Ada',
      verified: true,
      role: 'admin',
    });

    expect(parsed).toEqual({ displayName: 'Ada' });
  });
});
