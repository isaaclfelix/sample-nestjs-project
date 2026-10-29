import react from '@vitejs/plugin-react';
import type { UserConfig } from 'vitest/config';

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
    // Resolves the path aliases declared in tsconfig.json, including the ones
    // added by `nest g library`. Requires Vite 8, which ships this option.
    resolve: { tsconfigPaths: true },
  };
}
