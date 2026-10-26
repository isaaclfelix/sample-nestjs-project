import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Builds the Postgres driver adapter for Prisma Client.
 *
 * Reads `DATABASE_URL` from the environment (set by `.env`, Make, or e2e setup).
 *
 * @returns {PrismaPg} Adapter passed to `new PrismaClient({ adapter })`.
 * @throws {Error} When `DATABASE_URL` is missing or empty.
 */
export function createPrismaPgAdapter(): PrismaPg {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  return new PrismaPg({ connectionString });
}
