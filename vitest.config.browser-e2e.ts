import { defineConfig } from 'vitest/config';
import { sharedVitestViteConfig } from './vitest.shared.js';

export default defineConfig({
  ...sharedVitestViteConfig(),
  test: {
    name: 'e2e-browser',
    globals: true,
    root: './',
    include: ['**/*.browser-e2e-spec.ts'],
    setupFiles: ['./test/e2e-setup-file.ts'],
    // One worker avoids racing truncate and Vite across files against one DB.
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 120_000,
  },
});
