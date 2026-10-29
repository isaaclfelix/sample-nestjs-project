import { defineConfig } from 'vitest/config';
import { browserUnitSpecGlobs } from './vitest.config.browser.js';
import { sharedVitestViteConfig } from './vitest.shared.js';

export default defineConfig({
  test: {
    // Run-level coverage applies across node + browser unit projects.
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html', 'lcov', 'json-summary', 'json'],
      // App source including product React views; Nest wiring stays excluded.
      include: [
        'src/**/*.ts',
        'src/web/pages/**/*.tsx',
        'src/web/islands/**/*.tsx',
        'src/web/server-components/**/*.tsx',
        'src/web/shared-components/**/*.tsx',
      ],
      exclude: [
        'src/main.ts',
        // Vite build-time plugins; not Nest runtime.
        'src/web/vite-plugins/vite-shell-css-budget.ts',
        'src/web/vite-plugins/vite-strip-island-css-preload.ts',
        'src/web/vite-plugins/vite-suppress-island-css-inject.ts',
        'src/**/*.module.ts',
        'src/**/*.spec.ts',
        // Runtime/document plumbing; covered indirectly by SSR and browser e2e.
        'src/web/server-components/document.tsx',
        'src/web/runtime/ssr/entry-server.tsx',
        'src/web/runtime/island/hydrate.tsx',
        'src/web/runtime/island/island.tsx',
        // One-line window.location.assign wrapper; exercised via browser e2e.
        'src/web/api-fetch/assign-location.ts',
        'src/generated/**',
        '**/node_modules/**',
        '**/dist/**',
      ],
      // Floors locked under measured baseline after product .tsx inclusion
      // (logger.middleware + openapi.setup + thin assignLocation wrapper uncovered;
      // see docs/testing-and-coverage.md). Raise when coverage improves.
      thresholds: {
        statements: 96,
        branches: 96,
        functions: 96,
        lines: 96,
      },
    },
    projects: [
      {
        ...sharedVitestViteConfig(),
        test: {
          name: 'node',
          globals: true,
          root: './',
          include: ['**/*.spec.ts'],
          exclude: [
            '**/node_modules/**',
            '**/dist/**',
            ...browserUnitSpecGlobs,
          ],
        },
      },
      './vitest.config.browser.ts',
    ],
  },
});
