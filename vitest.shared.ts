import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { UserConfig } from 'vitest/config';

const repoRoot = dirname(fileURLToPath(import.meta.url));

/**
 * Shared Vite options for Vitest unit projects.
 *
 * File-based Vitest projects do not inherit the root config, so node and
 * browser configs import this helper instead of duplicating plugins/aliases.
 *
 * @returns {UserConfig} Base Vite config fragment for unit test projects.
 */
export function sharedVitestViteConfig(): UserConfig {
  return {
    plugins: [react()],
    // Same zone aliases as tsconfig.web.json / vite.config.ts (ADR-0027).
    resolve: {
      alias: {
        '@ui': resolve(repoRoot, 'src/web/ui'),
        '@protocol': resolve(repoRoot, 'src/web/protocol'),
        '@api': resolve(repoRoot, 'src/api'),
        '@archipielago': resolve(repoRoot, 'src/archipielago'),
      },
    },
  };
}
