import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { CsrfGuard } from './csrf.guard.js';
import { CSRF_HEADER_NAME } from './session.constants.js';

/**
 * Builds a minimal HTTP ExecutionContext for CsrfGuard tests.
 *
 * @param {Partial<{ method: string; path: string; session: { csrfToken: string }; header?: string }>} opts - Request fields.
 * @returns {ExecutionContext} Nest execution context stub.
 */
function httpContext(opts: {
  method: string;
  path: string;
  session?: { csrfToken: string };
  header?: string;
}): ExecutionContext {
  const headers: Record<string, string | undefined> = {};
  if (opts.header !== undefined) {
    headers[CSRF_HEADER_NAME] = opts.header;
  }
  const req = {
    method: opts.method,
    path: opts.path,
    session: opts.session,
    headers,
  };
  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as ExecutionContext;
}

describe('CsrfGuard', () => {
  const guard = new CsrfGuard();

  it('allows safe methods without a CSRF header', () => {
    expect(
      guard.canActivate(httpContext({ method: 'GET', path: '/api/user' })),
    ).toBe(true);
  });

  it('allows non-API mutating methods without CSRF', () => {
    expect(
      guard.canActivate(httpContext({ method: 'POST', path: '/register' })),
    ).toBe(true);
  });

  it('rejects mutating API calls with a missing token', () => {
    expect(() =>
      guard.canActivate(
        httpContext({
          method: 'POST',
          path: '/api/user',
          session: { csrfToken: 'expected-token-value-12' },
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('rejects mutating API calls with a wrong token', () => {
    expect(() =>
      guard.canActivate(
        httpContext({
          method: 'POST',
          path: '/api/user',
          session: { csrfToken: 'expected-token-value-12' },
          header: 'wrong-token-value-xxxx',
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows mutating API calls when the header matches the session', () => {
    const token = 'expected-token-value-12';
    expect(
      guard.canActivate(
        httpContext({
          method: 'POST',
          path: '/api/user',
          session: { csrfToken: token },
          header: token,
        }),
      ),
    ).toBe(true);
  });
});
