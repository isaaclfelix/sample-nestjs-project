import { PrismaClient } from '@prisma/client';

/**
 * Truncates all application tables between e2e tests.
 *
 * Uses TRUNCATE so identity/unique state is cleared without dropping the schema.
 *
 * @returns {Promise<void>}
 */
export async function truncateDatabase(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    // RESTART IDENTITY is a no-op for UUID PKs; CASCADE covers FKs when added later.
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "users" RESTART IDENTITY CASCADE',
    );
  } finally {
    await prisma.$disconnect();
  }
}
