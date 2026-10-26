import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/** Placeholder used only when DATABASE_URL is unset (e.g. CI `postinstall`). */
const PLACEHOLDER_DATABASE_URL =
  'postgresql://app:app@localhost:5432/app?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // `prisma generate` loads this config but does not connect. `env('DATABASE_URL')`
    // throws when the var is missing (CI has no `.env`), so fall back for codegen.
    // Migrate/seed/runtime still need a real DATABASE_URL to reach Postgres.
    url: process.env.DATABASE_URL ?? PLACEHOLDER_DATABASE_URL,
  },
});
