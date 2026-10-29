import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { SessionAuthGuard } from './session-auth.guard.js';

/**
 * Builds a minimal HTTP ExecutionContext for SessionAuthGuard tests.
 *
 * @param {{ userId?: string | null }} opts - Session user id when present.
 * @returns {ExecutionContext} Nest execution context stub.
 */
function httpContext(opts: { userId?: string | null }): ExecutionContext {
  const req = {
    session:
      opts.userId === undefined
        ? undefined
        : {
            id: 'sid',
            userId: opts.userId,
            csrfToken: 't',
            expiresAt: new Date(),
          },
  };
  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as ExecutionContext;
}

describe('SessionAuthGuard', () => {
  const guard = new SessionAuthGuard();

  it('allows requests with a userId on the session', () => {
    expect(
      guard.canActivate(
        httpContext({ userId: '11111111-1111-4111-8111-111111111111' }),
      ),
    ).toBe(true);
  });

  it('rejects anonymous sessions', () => {
    expect(() => guard.canActivate(httpContext({ userId: null }))).toThrow(
      UnauthorizedException,
    );
    expect(() => guard.canActivate(httpContext({}))).toThrow(
      UnauthorizedException,
    );
  });
});
