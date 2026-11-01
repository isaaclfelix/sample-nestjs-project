import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

const databaseUrlFile = join(import.meta.dirname, '.e2e-database-url');

/**
 * Starts a disposable Postgres via Testcontainers and applies Prisma migrations.
 *
 * Writes `DATABASE_URL` for worker processes (Vitest globalSetup runs in a
 * separate process from the tests).
 *
 * @returns {Promise<() => Promise<void>>} Teardown that stops the container.
 */
export default async function setup(): Promise<() => Promise<void>> {
  const container = await new PostgreSqlContainer('postgres:16-alpine').start();
  const databaseUrl = container.getConnectionUri();

  process.env.DATABASE_URL = databaseUrl;
  writeFileSync(databaseUrlFile, databaseUrl, 'utf8');

  // Apply committed migrations so the e2e schema matches production.
  execSync('pnpm exec prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });

  return async (): Promise<void> => {
    await container.stop();
  };
}
