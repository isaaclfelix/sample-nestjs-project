import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import { sharedVitestViteConfig } from './vitest.shared.js';

/**
 * Globs owned by the browser unit project (real Chromium via Playwright provider).
 *
 * Keep in sync with the node project `exclude` list in {@link ./vitest.config.ts}.
 */
export const browserUnitSpecGlobs: string[] = [
  'src/web/ui/islands/**/*.spec.ts',
  'src/web/ui/pages/**/*.spec.ts',
  'src/web/ui/hooks/**/*.spec.ts',
  'src/web/ui/api-fetch/csrf.spec.ts',
  'src/web/ui/runtime/island/hydrate.spec.ts',
];

export default defineConfig({
  ...sharedVitestViteConfig(),
  test: {
    name: 'browser',
    globals: true,
    root: './',
    setupFiles: ['./test/vitest-browser-setup.ts'],
    include: browserUnitSpecGlobs,
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
});
