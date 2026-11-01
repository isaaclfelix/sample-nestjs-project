import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule, ObserveInstrument } from './app.module.js';
import { StandardSchemaValidationPipe } from '@nestjs/common';
import { setupOpenApi } from './api/openapi.setup.js';
import { mountArchipielagoAssets } from '@archipielago/nestjs/mount-assets.js';
import { registerAppIslands } from './web/register-app-islands.js';

/**
 * Starts the Nest HTTP application.
 *
 * Registers the app islands manifest into Archipielago, the global Standard
 * Schema validation pipe, Swagger UI at `/api/docs`, Archipielago client assets
 * (Vite middleware in development, static files in production), and listens on
 * PORT or 3000.
 *
 * @returns {Promise<void>} Resolves when the server is listening.
 */
async function bootstrap(): Promise<void> {
  // App injects the generated islands manifest; Nest never reads it for responses.
  registerAppIslands();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    instrument: ObserveInstrument,
  });

  app.useGlobalPipes(new StandardSchemaValidationPipe());
  setupOpenApi(app);

  // Archipielago selects and mounts the production or development asset path.
  await mountArchipielagoAssets(app);

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
