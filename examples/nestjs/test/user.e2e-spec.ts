import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { createE2eApp } from './e2e-app.js';
import {
  obtainAuthenticatedSession,
  obtainCsrfSession,
  withCsrf,
  type CsrfSession,
} from './csrf-session.js';

const validBody = {
  email: 'ada@example.com',
  username: 'Ada_Lovelace',
  displayName: 'Ada Lovelace',
  password: 'correct-horse',
};

describe('UserController (e2e)', () => {
  let app: INestApplication<App>;
  let csrf: CsrfSession;

  beforeEach(async () => {
    app = await createE2eApp({ validationPipe: true });
    csrf = await obtainCsrfSession(app);
  });

  afterEach(async () => {
    await app.close();
  });

  /**
   * POSTs a create-user body with the guest CSRF session.
   *
   * @param {Record<string, unknown>} [overrides] - Fields to merge into the valid body.
   * @returns {Promise<request.Response>} Supertest response.
   */
  async function createUser(overrides: Record<string, unknown> = {}) {
    return withCsrf(request(app.getHttpServer()).post('/api/user'), csrf).send({
      ...validBody,
      ...overrides,
    });
  }

  describe('POST /api/user', () => {
    it('creates a user and does not return the password', async () => {
      const { body, status } = await createUser();

      expect(status).toBe(201);
      expect(body).toMatchObject({
        email: validBody.email,
        username: validBody.username,
        displayName: validBody.displayName,
        verified: false,
      });
      expect(body.id).toEqual(expect.any(String));
      expect(body).not.toHaveProperty('password');
    });

    it('rejects POST without a CSRF token', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/api/user')
        .set('Cookie', csrf.cookie)
        .send(validBody);

      expect(status).toBe(403);
    });

    it('normalizes a leading @ on username', async () => {
      const { body, status } = await createUser({ username: '@Ada_Lovelace' });

      expect(status).toBe(201);
      expect(body.username).toBe('Ada_Lovelace');
    });

    it('rejects client-supplied id or verified', async () => {
      const { status } = await createUser({
        id: '00000000-0000-4000-8000-000000000000',
        verified: true,
      });

      expect(status).toBe(400);
    });

    it.each([
      { email: 'not-an-email' },
      { password: 'short' },
      { username: 'ab' },
      { username: 'ada-nogo' },
      { displayName: '' },
    ])('returns 400 for invalid payload %j', async (overrides) => {
      const { status } = await createUser(overrides);
      expect(status).toBe(400);
    });

    it('returns 409 when email or username is already taken', async () => {
      expect((await createUser()).status).toBe(201);
      expect((await createUser()).status).toBe(409);
      expect((await createUser({ email: 'other@example.com' })).status).toBe(
        409,
      );
      expect((await createUser({ username: 'OtherUser' })).status).toBe(409);
    });

    it('returns 409 for a case-only duplicate username', async () => {
      expect((await createUser()).status).toBe(201);
      expect(
        (
          await createUser({
            email: 'other@example.com',
            username: 'ada_lovelace',
          })
        ).status,
      ).toBe(409);
    });

    it('returns 409 for a case-only duplicate email', async () => {
      expect((await createUser()).status).toBe(201);
      expect(
        (
          await createUser({
            email: 'ADA@EXAMPLE.COM',
            username: 'OtherUser',
          })
        ).status,
      ).toBe(409);
    });
  });

  describe('GET /api/user/:id', () => {
    it('returns the created user', async () => {
      const created = (await createUser()).body;

      const { status, body } = await request(app.getHttpServer()).get(
        `/api/user/${created.id}`,
      );

      expect(status).toBe(200);
      expect(body).toEqual(created);
    });

    it('returns 404 for an unknown id', async () => {
      const { status } = await request(app.getHttpServer()).get(
        '/api/user/11111111-1111-4111-8111-111111111111',
      );

      expect(status).toBe(404);
    });

    it('returns 400 for a non-uuid path', async () => {
      const { status } = await request(app.getHttpServer()).get(
        '/api/user/not-a-uuid',
      );

      expect(status).toBe(400);
    });
  });

  describe('PATCH /api/user/:id', () => {
    it('updates displayName when the owner is signed in', async () => {
      const { session, userId } = await obtainAuthenticatedSession(
        app,
        validBody,
      );

      const { status, body } = await withCsrf(
        request(app.getHttpServer()).patch(`/api/user/${userId}`),
        session,
      ).send({ displayName: 'Augusta Ada' });

      expect(status).toBe(200);
      expect(body.displayName).toBe('Augusta Ada');
      expect(body.email).toBe(validBody.email);
      expect(body.username).toBe(validBody.username);
    });

    it('returns 401 when PATCH has CSRF but no authenticated session', async () => {
      const created = (await createUser()).body;

      const { status } = await withCsrf(
        request(app.getHttpServer()).patch(`/api/user/${created.id}`),
        csrf,
      ).send({ displayName: 'Augusta Ada' });

      expect(status).toBe(401);
    });

    it('returns 403 when PATCH targets another user', async () => {
      const owner = await obtainAuthenticatedSession(app, validBody);
      const other = await obtainAuthenticatedSession(app, {
        email: 'other@example.com',
        username: 'OtherUser',
        displayName: 'Other',
        password: 'correct-horse',
      });

      const { status } = await withCsrf(
        request(app.getHttpServer()).patch(`/api/user/${owner.userId}`),
        other.session,
      ).send({ displayName: 'Hijacked' });

      expect(status).toBe(403);
    });

    it('updates password only for the owner', async () => {
      const { session, userId } = await obtainAuthenticatedSession(
        app,
        validBody,
      );

      const { status, body } = await withCsrf(
        request(app.getHttpServer()).patch(`/api/user/${userId}`),
        session,
      ).send({ password: 'correct-horse-2' });

      expect(status).toBe(200);
      expect(body).not.toHaveProperty('password');
      expect(body.id).toBe(userId);
    });

    it('rejects an empty body', async () => {
      const { session, userId } = await obtainAuthenticatedSession(
        app,
        validBody,
      );

      const { status } = await withCsrf(
        request(app.getHttpServer()).patch(`/api/user/${userId}`),
        session,
      ).send({});

      expect(status).toBe(400);
    });

    it('rejects email and username on PATCH', async () => {
      const { session, userId } = await obtainAuthenticatedSession(
        app,
        validBody,
      );

      const { status } = await withCsrf(
        request(app.getHttpServer()).patch(`/api/user/${userId}`),
        session,
      ).send({
        email: 'new@example.com',
        username: 'new_handle',
        displayName: 'Ada',
      });

      expect(status).toBe(400);
    });

    it('returns 400 when a provided field is invalid', async () => {
      const { session, userId } = await obtainAuthenticatedSession(
        app,
        validBody,
      );

      const { status } = await withCsrf(
        request(app.getHttpServer()).patch(`/api/user/${userId}`),
        session,
      ).send({ password: 'short' });

      expect(status).toBe(400);
    });

    it('returns 400 for a non-uuid path', async () => {
      const { session } = await obtainAuthenticatedSession(app, validBody);

      const { status } = await withCsrf(
        request(app.getHttpServer()).patch('/api/user/not-a-uuid'),
        session,
      ).send({ displayName: 'Ada' });

      expect(status).toBe(400);
    });
  });

  describe('DELETE /api/user/:id', () => {
    it('returns 204 and the user is gone for the owner', async () => {
      const { session, userId } = await obtainAuthenticatedSession(
        app,
        validBody,
      );

      await withCsrf(
        request(app.getHttpServer()).delete(`/api/user/${userId}`),
        session,
      )
        .expect(204)
        .expect('');

      await request(app.getHttpServer()).get(`/api/user/${userId}`).expect(404);
    });

    it('returns 401 when DELETE has CSRF but no authenticated session', async () => {
      const created = (await createUser()).body;

      const { status } = await withCsrf(
        request(app.getHttpServer()).delete(`/api/user/${created.id}`),
        csrf,
      );

      expect(status).toBe(401);
    });

    it('returns 403 when DELETE targets another user', async () => {
      const owner = await obtainAuthenticatedSession(app, validBody);
      const other = await obtainAuthenticatedSession(app, {
        email: 'other@example.com',
        username: 'OtherUser',
        displayName: 'Other',
        password: 'correct-horse',
      });

      const { status } = await withCsrf(
        request(app.getHttpServer()).delete(`/api/user/${owner.userId}`),
        other.session,
      );

      expect(status).toBe(403);
    });

    it('returns 400 for a non-uuid path', async () => {
      const { session } = await obtainAuthenticatedSession(app, validBody);

      await withCsrf(
        request(app.getHttpServer()).delete('/api/user/not-a-uuid'),
        session,
      ).expect(400);
    });
  });
});
