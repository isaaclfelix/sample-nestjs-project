import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Prefer process.env over env('DATABASE_URL'): env() throws when unset, and
    // every CLI command loads this file—including `prisma generate`, which does
    // not need a URL. Migrate/db commands still require DATABASE_URL at runtime.
    url: process.env.DATABASE_URL,
  },
});
