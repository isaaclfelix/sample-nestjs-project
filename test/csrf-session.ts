import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import {
  CSRF_HEADER_NAME,
  SESSION_COOKIE_NAME,
} from '../src/api/auth/session.constants.js';

export type CsrfSession = {
  /** Cookie header value to send (e.g. `sid=...`). */
  cookie: string;
  /** CSRF token from the HTML meta tag. */
  csrfToken: string;
};

/**
 * Obtains a guest session the same way a browser does: load an HTML page.
 *
 * Parses `Set-Cookie` for `sid` and `<meta name="csrf-token">`. No JSON CSRF
 * bootstrap endpoint exists.
 *
 * @param {INestApplication<App>} app - Booted Nest e2e application.
 * @param {string} [pagePath='/register'] - HTML path that embeds the meta tag.
 * @returns {Promise<CsrfSession>} Cookie and CSRF token for mutating API calls.
 */
export async function obtainCsrfSession(
  app: INestApplication<App>,
  pagePath: string = '/register',
): Promise<CsrfSession> {
  const res = await request(app.getHttpServer()).get(pagePath).expect(200);

  const rawCookies = res.headers['set-cookie'];
  const setCookie = Array.isArray(rawCookies)
    ? rawCookies
    : rawCookies
      ? [rawCookies]
      : [];
  const sidCookie = setCookie.find((c) =>
    c.startsWith(`${SESSION_COOKIE_NAME}=`),
  );
  if (!sidCookie) {
    throw new Error(
      `Expected ${SESSION_COOKIE_NAME} Set-Cookie on ${pagePath}`,
    );
  }
  const cookie = sidCookie.split(';')[0];

  const match = /<meta\b[^>]*\bname="csrf-token"[^>]*\bcontent="([^"]+)"/i.exec(
    res.text,
  );
  if (!match?.[1]) {
    throw new Error(`Expected csrf-token meta on ${pagePath}`);
  }

  return { cookie, csrfToken: match[1] };
}

/**
 * Applies session cookie and CSRF header to a supertest request.
 *
 * @param {request.Test} req - Supertest request builder.
 * @param {CsrfSession} session - Values from {@link obtainCsrfSession}.
 * @returns {request.Test} The same request with auth headers set.
 */
export function withCsrf(
  req: request.Test,
  session: CsrfSession,
): request.Test {
  return req
    .set('Cookie', session.cookie)
    .set(CSRF_HEADER_NAME, session.csrfToken);
}

/**
 * Registers and logs in, returning a CSRF session bound to that user.
 *
 * @param {INestApplication<App>} app - Booted Nest e2e application.
 * @param {{ email: string; username: string; displayName: string; password: string }} user - Create-user body.
 * @returns {Promise<{ session: CsrfSession; userId: string }>} Authed CSRF session and id.
 */
export async function obtainAuthenticatedSession(
  app: INestApplication<App>,
  user: {
    email: string;
    username: string;
    displayName: string;
    password: string;
  },
): Promise<{ session: CsrfSession; userId: string }> {
  const guest = await obtainCsrfSession(app);
  const created = await withCsrf(
    request(app.getHttpServer()).post('/api/user'),
    guest,
  ).send(user);
  expect(created.status).toBe(201);

  const login = await withCsrf(
    request(app.getHttpServer()).post('/api/auth/login'),
    guest,
  ).send({
    identifier: user.email,
    password: user.password,
  });
  expect(login.status).toBe(200);

  const loginCookies = login.headers['set-cookie'];
  const setCookie = Array.isArray(loginCookies)
    ? loginCookies
    : loginCookies
      ? [loginCookies]
      : [];
  const sidCookie = setCookie.find((c) =>
    c.startsWith(`${SESSION_COOKIE_NAME}=`),
  );
  if (!sidCookie) {
    throw new Error('Expected sid Set-Cookie after login');
  }
  const cookie = sidCookie.split(';')[0];

  // Reload HTML with the new cookie so the meta matches the regenerated CSRF.
  const page = await request(app.getHttpServer())
    .get('/login')
    .set('Cookie', cookie)
    .expect(200);
  const match = /<meta\b[^>]*\bname="csrf-token"[^>]*\bcontent="([^"]+)"/i.exec(
    page.text,
  );
  if (!match?.[1]) {
    throw new Error('Expected csrf-token meta after login');
  }

  return {
    session: { cookie, csrfToken: match[1] },
    userId: created.body.id as string,
  };
}
