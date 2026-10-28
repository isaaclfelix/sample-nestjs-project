import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { createE2eApp } from './e2e-app.js';

/**
 * TD-001 — desired: unauthenticated POST /api/user is 401.
 * Today there is no auth, so this example fails until guards exist.
 * If it unexpectedly passes, promote it into test/user.e2e-spec.ts
 * and remove TD-001 from docs/known-tech-debt.md.
 */
describe('known tech debt (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await createE2eApp({ validationPipe: true });
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
});
