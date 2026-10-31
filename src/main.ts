import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule, ObserveInstrument } from './app.module.js';
import { StandardSchemaValidationPipe } from '@nestjs/common';
import { setupOpenApi } from './api/openapi.setup.js';
import { setViteDevServer } from './archipielago/host/page-loader.js';

/**
 * Starts the Nest HTTP application.
 *
 * Registers the global Standard Schema validation pipe, mounts Swagger UI at
 * `/api/docs`, serves the built client assets in production, and listens on
 * PORT or 3000.
 *
 * @returns {Promise<void>} Resolves when the server is listening.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    instrument: ObserveInstrument,
  });

  app.useGlobalPipes(new StandardSchemaValidationPipe());
  setupOpenApi(app);

  // Dev SSR loads TSX through Vite. Production serves the built client files
  // and renders from the SSR bundle. Missing files fall through to Nest.
  if (process.env.NODE_ENV === 'production') {
    app.useStaticAssets(join(process.cwd(), 'dist/client'), { index: false });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    setViteDevServer(vite);
    app.use(vite.middlewares);
  }

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
