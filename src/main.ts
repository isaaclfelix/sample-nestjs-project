import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule, ObserveInstrument } from './app.module.js';
import { StandardSchemaValidationPipe } from '@nestjs/common';
import { setupOpenApi } from './api/openapi.setup.js';
import {
  clientAssetsRoot,
  createDevAssetPipeline,
} from './archipielago/host/asset-pipeline.js';

/**
 * Starts the Nest HTTP application.
 *
 * Registers the global Standard Schema validation pipe, mounts Swagger UI at
 * `/api/docs`, mounts Archipielago client assets (Vite middleware in
 * development, static files in production), and listens on PORT or 3000.
 *
 * @returns {Promise<void>} Resolves when the server is listening.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    instrument: ObserveInstrument,
  });

  app.useGlobalPipes(new StandardSchemaValidationPipe());
  setupOpenApi(app);

  // Archipielago owns Vite create/register and the client root; Nest only mounts.
  if (process.env.NODE_ENV === 'production') {
    app.useStaticAssets(clientAssetsRoot(), { index: false });
  } else {
    const pipeline = await createDevAssetPipeline();
    app.use(pipeline.middlewares);
  }

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
