import { ConflictException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';

/**
 * Turns a Prisma unique-constraint error into an HTTP conflict.
 *
 * Expression indexes name email/username in the index id, so target matching
 * works for both column names and `users_*_lower_key` indexes.
 *
 * @param {Prisma.PrismaClientKnownRequestError} error - Prisma P2002 error.
 * @returns {ConflictException} Field-specific or generic conflict.
 */
export function conflictFromUniqueViolation(
  error: Prisma.PrismaClientKnownRequestError,
): ConflictException {
  // meta.target may be a string, string[], or other shapes; stringify for matching.
  const joined = JSON.stringify(error.meta?.target ?? '').toLowerCase();

  if (joined.includes('email')) {
    return new ConflictException('Email already in use');
  }
  if (joined.includes('username')) {
    return new ConflictException('Username already in use');
  }
  return new ConflictException('Email or username already in use');
}
