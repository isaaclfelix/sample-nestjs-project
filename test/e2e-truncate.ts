import { PrismaClient } from '../src/generated/prisma/client.js';
import { createPrismaPgAdapter } from '../src/persistence/create-prisma-pg-adapter.js';

/**
 * Truncates all application tables between e2e tests.
 *
 * Uses TRUNCATE so identity/unique state is cleared without dropping the schema.
 *
 * @returns {Promise<void>}
 */
export async function truncateDatabase(): Promise<void> {
  const prisma = new PrismaClient({ adapter: createPrismaPgAdapter() });
  try {
    // RESTART IDENTITY is a no-op for UUID PKs; CASCADE covers FKs when added later.
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "users" RESTART IDENTITY CASCADE',
    );
  } finally {
    await prisma.$disconnect();
  }
}
