/**
 * Optional local seed. Run via `make db-seed` after migrate.
 *
 * Idempotent for the demo user: skips insert when the email already exists.
 */
import { argon2, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const argon2Async = promisify(argon2);

/**
 * Hashes a password the same way as the app (Argon2id) for the demo user.
 *
 * Kept inline so the seed does not import Nest application modules.
 *
 * @param {string} plaintextPassword - Password to hash.
 * @returns {Promise<string>} Encoded Argon2id record.
 */
async function hashPassword(plaintextPassword: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await argon2Async('argon2id', {
    message: plaintextPassword,
    nonce: salt,
    memory: 19456,
    passes: 2,
    parallelism: 1,
    tagLength: 32,
  });
  return [
    'argon2id',
    19456,
    2,
    1,
    32,
    salt.toString('base64url'),
    hash.toString('base64url'),
  ].join('$');
}

/**
 * Seeds a single demo user when the database has none with that email.
 *
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
  const email = 'ada@example.com';

  // Skip when the demo user is already present.
  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });
  if (existing) {
    return;
  }

  await prisma.user.create({
    data: {
      email,
      username: 'Ada_Lovelace',
      displayName: 'Ada Lovelace',
      password: await hashPassword('password1'),
      verified: false,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
