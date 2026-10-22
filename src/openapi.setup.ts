import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Registers OpenAPI document generation and Swagger UI on the app.
 *
 * Mounts the interactive UI at `/docs` and the raw JSON spec at `/docs-json`
 * (Nest's default `{path}-json` URL). Call after global pipes so documented
 * routes match runtime validation.
 *
 * @param {INestApplication} app - The Nest application instance to document.
 * @returns {void}
 */
export function setupOpenApi(app: INestApplication): void {
  // Build the base OpenAPI document metadata shown in Swagger UI.
  const config = new DocumentBuilder()
    .setTitle('Sample NestJS API')
    .setDescription('HTTP API for this project')
    .setVersion('0.0.1')
    .build();

  // Defer document generation until first request so init stays cheap.
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);
}
