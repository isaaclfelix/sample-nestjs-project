import { argon2, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const argon2Async = promisify(argon2);

const ARGON2_PARAMS = {
  memory: 19456, // ~19 MiB
  passes: 2,
  parallelism: 1,
  tagLength: 32,
} as const;

/**
 * Hashes a password using Argon2id for safe persistent storage.
 *
 * Generates a random salt and encodes algorithm, cost parameters, salt, and
 * hash into a single string so verifyPassword can rebuild the same derivation.
 *
 * @param {string} plaintextPassword - The password to hash in plain text.
 * @returns {Promise<string>} Encoded record: argon2id$memory$passes$parallelism$tagLength$saltB64$hashB64.
 */
export async function hashPassword(plaintextPassword: string): Promise<string> {
  // Generate a random salt.
  const salt = randomBytes(16);

  // Hash the password with the salt.
  const hash = await argon2Async('argon2id', {
    message: plaintextPassword,
    nonce: salt,
    ...ARGON2_PARAMS,
  });

  // Return the encoded password.
  return [
    'argon2id',
    ARGON2_PARAMS.memory,
    ARGON2_PARAMS.passes,
    ARGON2_PARAMS.parallelism,
    ARGON2_PARAMS.tagLength,
    salt.toString('base64url'),
    hash.toString('base64url'),
  ].join('$');
}

/**
 * Checks a plaintext password against a stored Argon2id encoding.
 *
 * Parses salt and cost from the encoded string, derives a new hash, and
 * compares with timingSafeEqual. Malformed encodings return false.
 *
 * @param {string} encodedPassword - Stored hashPassword output.
 * @param {string} plaintextPassword - Candidate password in plain text.
 * @returns {Promise<boolean>} True when the password matches; false otherwise.
 */
export async function verifyPassword(
  encodedPassword: string,
  plaintextPassword: string,
): Promise<boolean> {
  // Split the encoded password into its components.
  const [algorithm, memory, passes, parallelism, tagLength, saltB64, hashB64] =
    encodedPassword.split('$');

  // Verify the algorithm and salt/hash are present.
  if (algorithm !== 'argon2id' || !saltB64 || !hashB64) {
    return false;
  }

  // Decode the salt and hash.
  const salt = Buffer.from(saltB64, 'base64url');
  const expected = Buffer.from(hashB64, 'base64url');

  // Recreate the hash with the plaintext password.
  const actual = await argon2Async('argon2id', {
    message: plaintextPassword,
    nonce: salt,
    memory: Number(memory),
    passes: Number(passes),
    parallelism: Number(parallelism),
    tagLength: Number(tagLength),
  });

  // Verify the lengths of the actual and expected hashes.
  if (actual.length !== expected.length) {
    return false;
  }

  // Compare the actual and expected hashes in a timing-safe manner.
  return timingSafeEqual(actual, expected);
}
