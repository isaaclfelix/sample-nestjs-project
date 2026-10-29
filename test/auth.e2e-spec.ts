import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { createE2eApp } from './e2e-app.js';
import {
  obtainCsrfSession,
  refreshCsrfSession,
  withCsrf,
  type CsrfSession,
} from './csrf-session.js';
import { SESSION_COOKIE_NAME } from '../src/api/auth/session.constants.js';

const validUser = {
  email: 'ada@example.com',
  username: 'Ada_Lovelace',
  displayName: 'Ada Lovelace',
  password: 'correct-horse',
};

describe('AuthController (e2e)', () => {
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
   * Registers the fixture user with the current CSRF session.
   *
   * @returns {Promise<request.Response>} Create-user response.
   */
  async function register(): Promise<request.Response> {
    return withCsrf(request(app.getHttpServer()).post('/api/user'), csrf).send(
      validUser,
    );
  }

  it('logs in with email and returns the public user', async () => {
    await register();

    const { status, body, headers } = await withCsrf(
      request(app.getHttpServer()).post('/api/auth/login'),
      csrf,
    ).send({
      identifier: validUser.email,
      password: validUser.password,
    });

    expect(status).toBe(200);
    expect(body).toMatchObject({
      email: validUser.email,
      username: validUser.username,
      verified: false,
    });
    expect(body).not.toHaveProperty('password');
    expect(headers['set-cookie']).toBeDefined();
  });

  it('logs in with username (case-insensitive)', async () => {
    await register();

    const { status, body } = await withCsrf(
      request(app.getHttpServer()).post('/api/auth/login'),
      csrf,
    ).send({
      identifier: 'ada_lovelace',
      password: validUser.password,
    });

    expect(status).toBe(200);
    expect(body.username).toBe(validUser.username);
  });

  it('returns the same 401 for unknown user and bad password', async () => {
    await register();

    const unknown = await withCsrf(
      request(app.getHttpServer()).post('/api/auth/login'),
      csrf,
    ).send({
      identifier: 'missing@example.com',
      password: validUser.password,
    });
    const badPassword = await withCsrf(
      request(app.getHttpServer()).post('/api/auth/login'),
      csrf,
    ).send({
      identifier: validUser.email,
      password: 'wrong-password-xx',
    });

    expect(unknown.status).toBe(401);
    expect(badPassword.status).toBe(401);
    expect(unknown.body.message).toEqual(badPassword.body.message);
  });

  it('logs out and clears the session cookie', async () => {
    await register();
    const login = await withCsrf(
      request(app.getHttpServer()).post('/api/auth/login'),
      csrf,
    ).send({
      identifier: validUser.email,
      password: validUser.password,
    });
    expect(login.status).toBe(200);

    const loginCookies = login.headers['set-cookie'];
    const loginSet = Array.isArray(loginCookies)
      ? loginCookies
      : loginCookies
        ? [loginCookies]
        : [];
    const sid = loginSet.find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
    expect(sid).toBeDefined();

    // CSRF rotated on login; scrape meta from `/` (guest-only /login would 302).
    const authed = await refreshCsrfSession(app, sid!.split(';')[0]);

    const logout = await withCsrf(
      request(app.getHttpServer()).post('/api/auth/logout'),
      authed,
    );
    expect(logout.status).toBe(204);
  });
});
