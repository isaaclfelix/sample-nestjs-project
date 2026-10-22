import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, StandardSchemaValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { UserModule } from '../src/user/user.module.js';

/**
 * TD-001 — desired: unauthenticated POST /user is 401.
 * Today there is no auth, so this example fails until guards exist.
 * If it unexpectedly passes, promote it into test/user.e2e-spec.ts
 * and remove TD-001 from docs/known-tech-debt.md.
 */
describe('known tech debt (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it.fails('TD-001: unauthenticated POST /user returns 401', async () => {
    const { status } = await request(app.getHttpServer()).post('/user').send({
      email: 'ada@example.com',
      username: 'Ada_Lovelace',
      displayName: 'Ada Lovelace',
      password: 'password1',
    });

    expect(status).toBe(401);
  });
});
