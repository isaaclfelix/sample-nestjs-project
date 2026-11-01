import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Loads DATABASE_URL written by the e2e global setup into this worker process.
 *
 * Vitest runs globalSetup in a separate process; workers only see env vars that
 * are set here (or injected another way).
 *
 * @returns {void}
 */
export function loadE2eDatabaseUrl(): void {
  if (process.env.DATABASE_URL) {
    return;
  }

  const databaseUrlFile = join(import.meta.dirname, '.e2e-database-url');
  process.env.DATABASE_URL = readFileSync(databaseUrlFile, 'utf8').trim();
}

loadE2eDatabaseUrl();
