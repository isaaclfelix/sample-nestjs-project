import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { setupOpenApi } from './../src/api/openapi.setup.js';
import { createE2eApp } from './e2e-app.js';

describe('OpenAPI (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await createE2eApp({
      validationPipe: true,
      configure: (nestApp) => {
        setupOpenApi(nestApp);
      },
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/docs-json exposes OpenAPI paths for /api/user', async () => {
    const { status, body } = await request(app.getHttpServer()).get(
      '/api/docs-json',
    );

    expect(status).toBe(200);
    expect(body.openapi).toEqual(expect.any(String));
    expect(body.paths).toHaveProperty('/api/user');
    expect(body.paths).not.toHaveProperty('/user');
    expect(body.paths['/api/user']).toHaveProperty('post');
  });

  it('GET /user and GET /docs are not API routes', async () => {
    await request(app.getHttpServer()).get('/user').expect(404);
    await request(app.getHttpServer()).get('/docs').expect(404);
  });
});
