import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, StandardSchemaValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';

/**
 * TD-001 — desired: unauthenticated POST /api/user is 401.
 * Today there is no auth, so this example fails until guards exist.
 * If it unexpectedly passes, promote it into test/user.e2e-spec.ts
 * and remove TD-001 from docs/known-tech-debt.md.
 */
describe('known tech debt (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it.fails('TD-001: unauthenticated POST /api/user returns 401', async () => {
    const { status } = await request(app.getHttpServer())
      .post('/api/user')
      .send({
        email: 'ada@example.com',
        username: 'Ada_Lovelace',
        displayName: 'Ada Lovelace',
        password: 'password1',
      });

    expect(status).toBe(401);
  });

  /**
   * TD-009 — desired: the demo counter island is gone from GET /.
   * It is on the page today so hydration can be clicked.
   * When this example unexpectedly passes, delete it and strike TD-009.
   * Do not promote it. "No demo counter" is not an ongoing product rule.
   * Update the hydration spec in the same change.
   */
  it.fails(
    'TD-009: GET / does not render the demo counter island',
    async () => {
      const { status, text } = await request(app.getHttpServer()).get('/');

      expect(status).toBe(200);
      expect(text).not.toContain('data-island="counter"');
    },
  );
});
