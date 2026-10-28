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
