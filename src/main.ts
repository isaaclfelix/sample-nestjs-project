import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import { StandardSchemaValidationPipe } from '@nestjs/common';
import { setupOpenApi } from './openapi.setup.js';

/**
 * Starts the Nest HTTP application.
 *
 * Registers the global Standard Schema validation pipe, mounts Swagger UI at
 * `/docs`, and listens on PORT or 3000.
 *
 * @returns {Promise<void>} Resolves when the server is listening.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  app.useGlobalPipes(new StandardSchemaValidationPipe());
  setupOpenApi(app);

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
