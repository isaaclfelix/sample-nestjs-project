import { defineConfig } from 'vitest/config';
import { sharedVitestViteConfig } from './vitest.shared.js';

export default defineConfig({
  ...sharedVitestViteConfig(),
  test: {
    name: 'e2e-http',
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    exclude: ['**/*.browser-e2e-spec.ts', '**/node_modules/**', '**/dist/**'],
    setupFiles: ['./test/e2e-setup-file.ts'],
    // One worker avoids racing truncate across files against one container DB.
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 60_000,
  },
});
