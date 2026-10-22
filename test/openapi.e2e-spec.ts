import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, StandardSchemaValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { setupOpenApi } from './../src/openapi.setup.js';

describe('OpenAPI (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    setupOpenApi(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /docs-json exposes OpenAPI paths for /user', async () => {
    const { status, body } = await request(app.getHttpServer()).get(
      '/docs-json',
    );

    expect(status).toBe(200);
    expect(body.openapi).toEqual(expect.any(String));
    expect(body.paths).toHaveProperty('/user');
    expect(body.paths['/user']).toHaveProperty('post');
  });
});
