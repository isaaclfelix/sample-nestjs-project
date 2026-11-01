import { ConflictException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { conflictFromUniqueViolation } from './prisma-unique-conflict.js';

/**
 * Builds a Prisma P2002 unique-violation error for tests.
 *
 * @param {string | string[] | undefined} target - Constraint target from Prisma meta.
 * @returns {Prisma.PrismaClientKnownRequestError}
 */
function uniqueViolation(
  target?: string | string[],
): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
    meta: target === undefined ? {} : { target },
  });
}

describe('conflictFromUniqueViolation', () => {
  it('maps email index names to Email already in use', () => {
    expect(
      conflictFromUniqueViolation(uniqueViolation('users_email_lower_key')),
    ).toEqual(new ConflictException('Email already in use'));
  });

  it('maps username index names to Username already in use', () => {
    expect(
      conflictFromUniqueViolation(
        uniqueViolation(['users_username_lower_key']),
      ),
    ).toEqual(new ConflictException('Username already in use'));
  });

  it('maps column-name email targets to Email already in use', () => {
    expect(conflictFromUniqueViolation(uniqueViolation('email'))).toEqual(
      new ConflictException('Email already in use'),
    );
  });

  it('maps unknown targets to a generic conflict', () => {
    expect(conflictFromUniqueViolation(uniqueViolation('other_key'))).toEqual(
      new ConflictException('Email or username already in use'),
    );
  });

  it('treats missing targets as a generic conflict', () => {
    expect(conflictFromUniqueViolation(uniqueViolation())).toEqual(
      new ConflictException('Email or username already in use'),
    );
  });
});
