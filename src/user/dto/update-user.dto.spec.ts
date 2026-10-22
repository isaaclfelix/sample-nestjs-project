import { updateUserSchema } from './update-user.dto.js';

describe('updateUserSchema', () => {
  it('rejects an empty object', () => {
    expect(updateUserSchema.safeParse({}).success).toBe(false);
  });

  it('accepts displayName and/or password independently', () => {
    expect(updateUserSchema.parse({ displayName: 'Ada' })).toEqual({
      displayName: 'Ada',
    });
    expect(updateUserSchema.parse({ password: 'password1' })).toEqual({
      password: 'password1',
    });
  });

  it('rejects email and username instead of applying them', () => {
    const result = updateUserSchema.safeParse({
      email: 'new@example.com',
      username: 'new_handle',
      displayName: 'Ada',
    });

    expect(result.success).toBe(false);
  });

  it('still enforces create rules on fields that are present', () => {
    expect(updateUserSchema.safeParse({ password: 'short' }).success).toBe(
      false,
    );
    expect(updateUserSchema.safeParse({ displayName: '' }).success).toBe(false);
  });

  it('rejects unknown keys', () => {
    const result = updateUserSchema.safeParse({
      displayName: 'Ada',
      verified: true,
      role: 'admin',
    });

    expect(result.success).toBe(false);
  });
});
