import type { AddressInfo } from 'node:net';
import { INestApplication, StandardSchemaValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test, type TestingModule } from '@nestjs/testing';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { createDevAssetPipeline } from '../src/archipielago/host/asset-pipeline.js';
import { setViteDevServer } from '../src/archipielago/host/page-loader.js';
import type { E2eAppOptions } from './e2e-app.js';
import { truncateDatabase } from './e2e-truncate.js';

export type BrowserE2eApp = {
  /** Booted Nest application listening on {@link BrowserE2eApp.baseURL}. */
  app: INestApplication<App>;
  /** Origin for Playwright `page.goto` (e.g. `http://127.0.0.1:49152`). */
  baseURL: string;
  /**
   * Closes Nest and the Vite middleware server, then clears the loader hook.
   *
   * @returns {Promise<void>}
   */
  close: () => Promise<void>;
};

/**
 * Boots Nest with Vite middleware and listens on an ephemeral port.
 *
 * HTTP e2e uses {@link createE2eApp} without Vite or `listen` (supertest
 * injects into the in-process server). Browser journeys need real asset URLs
 * (`/@vite/client`, hydrate entry) the same way `main.ts` serves them in
 * development. Vite is registered **before** `app.init()` so middleware is
 * part of the Express stack Nest finalizes on init.
 *
 * @param {E2eAppOptions} [options] - Pipe and configure hooks (validation on by default).
 * @returns {Promise<BrowserE2eApp>} Listening app, base URL, and teardown.
 */
export async function createBrowserE2eApp(
  options: E2eAppOptions = {},
): Promise<BrowserE2eApp> {
  // Clear rows from the previous test before wiring a new Nest app.
  await truncateDatabase();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication() as NestExpressApplication;
  // Default validation on so form POSTs match production pipe behavior.
  if (options.validationPipe !== false) {
    app.useGlobalPipes(new StandardSchemaValidationPipe());
  }
  options.configure?.(app);

  const pipeline = await createDevAssetPipeline();
  app.use(pipeline.middlewares);

  await app.init();
  await app.listen(0);
  const address = app.getHttpServer().address() as AddressInfo | string | null;
  if (address === null || typeof address === 'string') {
    await pipeline.vite.close();
    setViteDevServer(undefined);
    await app.close();
    throw new Error('Expected Nest to listen on a TCP port');
  }

  const baseURL = `http://127.0.0.1:${String(address.port)}`;

  return {
    app,
    baseURL,
    close: async (): Promise<void> => {
      await app.close();
      await pipeline.vite.close();
      setViteDevServer(undefined);
    },
  };
}
