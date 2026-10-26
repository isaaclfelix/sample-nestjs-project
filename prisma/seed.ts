/**
 * Optional local seed. Run via `make db-seed` after migrate.
 *
 * Idempotent for the demo user: skips insert when the email already exists.
 */
import { PrismaClient } from '../src/generated/prisma/client.js';
import { hashPassword } from '../src/api/common/password.js';
import { createPrismaPgAdapter } from '../src/persistence/create-prisma-pg-adapter.js';

const prisma = new PrismaClient({ adapter: createPrismaPgAdapter() });

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
