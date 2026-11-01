import { defineConfig } from 'vitest/config';

/**
 * E2E workspace: HTTP (supertest) + browser (Playwright library) projects.
 *
 * Nest + Testcontainers stay out of the default unit `projects` in
 * {@link ./vitest.config.ts}. `globalSetup` lives here so Postgres starts
 * once for both projects (see ADR-0021).
 */
export default defineConfig({
  test: {
    globalSetup: ['./test/e2e-global-setup.ts'],
    projects: ['./vitest.config.e2e-http.ts', './vitest.config.browser-e2e.ts'],
  },
});
