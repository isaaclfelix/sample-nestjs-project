import { hashPassword, verifyPassword } from './password.js';

describe('password helpers', () => {
  it('hashes a password into the expected argon2id encoding', async () => {
    const encoded = await hashPassword('correct horse');

    const parts = encoded.split('$');
    expect(parts[0]).toBe('argon2id');
    expect(parts).toHaveLength(7);
    expect(Number(parts[1])).toBe(19456);
    expect(Number(parts[2])).toBe(2);
    expect(Number(parts[3])).toBe(1);
    expect(Number(parts[4])).toBe(32);
    expect(parts[5]).toBeTruthy();
    expect(parts[6]).toBeTruthy();
  });

  it('verifies the original password and rejects a wrong one', async () => {
    const encoded = await hashPassword('correct horse');

    await expect(verifyPassword(encoded, 'correct horse')).resolves.toBe(true);
    await expect(verifyPassword(encoded, 'wrong horse')).resolves.toBe(false);
  });

  it('uses a unique salt so the same password hashes differently twice', async () => {
    const first = await hashPassword('same-password');
    const second = await hashPassword('same-password');

    expect(first).not.toBe(second);
    await expect(verifyPassword(first, 'same-password')).resolves.toBe(true);
    await expect(verifyPassword(second, 'same-password')).resolves.toBe(true);
  });

  it('hashes unicode passwords', async () => {
    const encoded = await hashPassword('pässwörd🔒');

    await expect(verifyPassword(encoded, 'pässwörd🔒')).resolves.toBe(true);
    await expect(verifyPassword(encoded, 'passwörd🔒')).resolves.toBe(false);
  });

  it.each([
    '',
    'not-an-encoded-hash',
    'bcrypt$19456$2$1$32$salt$hash',
    'argon2id',
    'argon2id$19456$2$1$32',
    'argon2id$19456$2$1$32$onlysalt',
  ])('returns false for malformed encoded value %j', async (encoded) => {
    await expect(verifyPassword(encoded, 'anything')).resolves.toBe(false);
  });

  it('returns false when the stored hash segment is tampered with', async () => {
    const encoded = await hashPassword('secret-password');
    const parts = encoded.split('$');
    parts[6] = Buffer.from('tampered-hash-value-pad-pad-pad-!').toString(
      'base64url',
    );

    await expect(
      verifyPassword(parts.join('$'), 'secret-password'),
    ).resolves.toBe(false);
  });
});
