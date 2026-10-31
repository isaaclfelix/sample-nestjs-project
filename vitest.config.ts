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
        'src/web/ui/pages/**/*.tsx',
        'src/web/ui/islands/**/*.tsx',
        'src/web/ui/server-components/**/*.tsx',
        'src/web/ui/shared-components/**/*.tsx',
      ],
      exclude: [
        'src/main.ts',
        // Vite build-time plugins; not Nest runtime.
        'src/archipielago/vite/vite-shell-css-budget.ts',
        'src/archipielago/vite/vite-strip-island-css-preload.ts',
        'src/archipielago/vite/vite-suppress-island-css-inject.ts',
        'src/**/*.module.ts',
        'src/**/*.spec.ts',
        // Storybook workshop files; not unit-tested runtime.
        'src/**/*.stories.ts',
        'src/**/*.stories.tsx',
        // Runtime/document plumbing; covered indirectly by SSR and browser e2e.
        'src/web/ui/server-components/document/document.tsx',
        'src/web/ui/runtime/ssr/entry-server.tsx',
        'src/archipielago/react/runtime/island/hydrate.tsx',
        'src/web/ui/runtime/island/hydrate-entry.tsx',
        'src/archipielago/react/runtime/island/island.tsx',
        'src/web/register-app-islands.ts',
        // One-line window.location.assign wrapper; exercised via browser e2e.
        'src/web/ui/api-fetch/assign-location.ts',
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
          setupFiles: ['./test/vitest-register-islands.ts'],
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
