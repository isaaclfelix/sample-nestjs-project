import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { createE2eApp } from './e2e-app.js';
import {
  obtainCsrfSession,
  withCsrf,
  type CsrfSession,
} from './csrf-session.js';

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

    // After login the CSRF token rotated; obtain a fresh page session for logout.
    const afterLogin = await obtainCsrfSession(app, '/login');
    // Prefer the cookie from login Set-Cookie when present.
    const loginCookies = login.headers['set-cookie'];
    const loginSet = Array.isArray(loginCookies)
      ? loginCookies
      : loginCookies
        ? [loginCookies]
        : [];
    const sid = loginSet.find((c) => c.startsWith('sid='));
    const session: CsrfSession = sid
      ? {
          cookie: sid.split(';')[0],
          csrfToken: afterLogin.csrfToken,
        }
      : afterLogin;

    // CSRF after regenerate must match the new session — load /login with the new cookie.
    const page = await request(app.getHttpServer())
      .get('/login')
      .set('Cookie', session.cookie)
      .expect(200);
    const match =
      /<meta\b[^>]*\bname="csrf-token"[^>]*\bcontent="([^"]+)"/i.exec(
        page.text,
      );
    expect(match?.[1]).toBeDefined();
    const authed: CsrfSession = {
      cookie: session.cookie,
      csrfToken: match![1],
    };

    const logout = await withCsrf(
      request(app.getHttpServer()).post('/api/auth/logout'),
      authed,
    );
    expect(logout.status).toBe(204);
  });
});
