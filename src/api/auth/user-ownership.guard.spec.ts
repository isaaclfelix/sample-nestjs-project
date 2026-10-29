import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { UserOwnershipGuard } from './user-ownership.guard.js';

/**
 * Builds a minimal HTTP ExecutionContext for UserOwnershipGuard tests.
 *
 * @param {{ userId: string | null; id: string }} opts - Session user and path id.
 * @returns {ExecutionContext} Nest execution context stub.
 */
function httpContext(opts: {
  userId: string | null;
  id: string;
}): ExecutionContext {
  const req = {
    params: { id: opts.id },
    session: {
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

describe('UserOwnershipGuard', () => {
  const guard = new UserOwnershipGuard();
  const id = '11111111-1111-4111-8111-111111111111';

  it('allows when session.userId matches path id', () => {
    expect(guard.canActivate(httpContext({ userId: id, id }))).toBe(true);
  });

  it('rejects when the ids differ', () => {
    expect(() =>
      guard.canActivate(
        httpContext({
          userId: '22222222-2222-4222-8222-222222222222',
          id,
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('passes non-UUID ids through for the validation pipe', () => {
    expect(
      guard.canActivate(httpContext({ userId: id, id: 'not-a-uuid' })),
    ).toBe(true);
  });
});
