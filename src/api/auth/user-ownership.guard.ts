import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';

/**
 * Requires `session.userId` to equal the `:id` path parameter.
 *
 * Pair with {@link SessionAuthGuard} so anonymous callers get 401 first.
 * Non-UUID path ids pass through so the param validation pipe can return 400.
 */
@Injectable()
export class UserOwnershipGuard implements CanActivate {
  /**
   * Allows the request when the path id is the signed-in user.
   *
   * @param {ExecutionContext} context - Nest HTTP execution context.
   * @returns {boolean} True when the caller owns the resource (or id is not a UUID yet).
   * @throws {ForbiddenException} When the session user does not match `:id`.
   */
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const id = req.params['id'];
    // Guards run before pipes; leave malformed ids to `@Param({ schema: z.uuid() })`.
    if (!id || !z.uuid().safeParse(id).success) {
      return true;
    }
    if (req.session?.userId !== id) {
      throw new ForbiddenException();
    }
    return true;
  }
}
