import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule, ObserveInstrument } from './app.module.js';
import { StandardSchemaValidationPipe } from '@nestjs/common';
import { setupOpenApi } from './api/openapi.setup.js';
import {
  clientAssetsRoot,
  createDevAssetPipeline,
} from './archipielago/host/asset-pipeline.js';
import { registerAppIslands } from './web/register-app-islands.js';

/**
 * Starts the Nest HTTP application.
 *
 * Registers the app island table into Archipielago, the global Standard Schema
 * validation pipe, Swagger UI at `/api/docs`, Archipielago client assets (Vite
 * middleware in development, static files in production), and listens on PORT
 * or 3000.
 *
 * @returns {Promise<void>} Resolves when the server is listening.
 */
async function bootstrap(): Promise<void> {
  // App injects the generated islands map; Nest never reads it for responses.
  registerAppIslands();

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
