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
      // App source only; product React (.tsx) joins coverage when island specs land.
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        // Vite build-time plugins; not Nest runtime.
        'src/web/vite-plugins/vite-shell-css-budget.ts',
        'src/web/vite-plugins/vite-strip-island-css-preload.ts',
        'src/web/vite-plugins/vite-suppress-island-css-inject.ts',
        'src/**/*.module.ts',
        'src/**/*.spec.ts',
        'src/**/*.tsx',
        'src/generated/**',
        '**/node_modules/**',
        '**/dist/**',
      ],
      // Floors locked under measured baseline after include/exclude
      // (logger.middleware + openapi.setup uncovered; see docs/testing-and-coverage.md).
      // Branches stay at 99: `@Injectable()` decorator emit leaves a cond-expr
      // branch that V8 attributes to the call site and cannot be hit in unit tests.
      thresholds: {
        statements: 96,
        branches: 99,
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
