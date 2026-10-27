import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`. Requires Vite 8, which ships this option.
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html', 'lcov', 'json-summary', 'json'],
      // App source only; Nest wiring and bootstrap are excluded as low-value noise.
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        // Vite build-time plugin (shell CSS size report); not Nest runtime.
        'src/web/vite-shell-css-budget.ts',
        'src/**/*.module.ts',
        'src/**/*.spec.ts',
        'src/**/*.tsx',
        'src/generated/**',
        '**/node_modules/**',
        '**/dist/**',
      ],
      // Floors locked ~2pts under measured baseline after include/exclude
      // (logger.middleware + openapi.setup uncovered; see docs/testing-and-coverage.md).
      thresholds: {
        statements: 86,
        branches: 100,
        functions: 86,
        lines: 87,
      },
    },
  },
});
