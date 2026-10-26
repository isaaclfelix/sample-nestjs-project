import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../persistence/prisma.service.js';
import { User } from './entities/user.entity.js';
import {
  CreateUserRecord,
  UpdateUserRecord,
  UserRepository,
} from './user.repository.js';

type PrismaUserRow = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  password: string;
  verified: boolean;
};

/**
 * Maps a Prisma `users` row to the domain {@link User} type.
 *
 * @param {PrismaUserRow} row - Raw Prisma user record.
 * @returns {User} Persistence-agnostic user.
 */
function toDomainUser(row: PrismaUserRow): User {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.displayName,
    password: row.password,
    verified: row.verified,
  };
}

/**
 * Turns a Prisma unique-constraint error into an HTTP conflict.
 *
 * Expression indexes name email/username in the index id, so target matching
 * works for both column names and `users_*_lower_key` indexes.
 *
 * @param {Prisma.PrismaClientKnownRequestError} error - Prisma P2002 error.
 * @returns {ConflictException} Field-specific or generic conflict.
 */
function conflictFromUniqueViolation(
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

/**
 * Prisma adapter for {@link UserRepository}.
 *
 * Owns Prisma types and error codes so UserService stays store-agnostic.
 * Registered via a Nest factory (no class decorator) so coverage is not
 * skewed by decorator emit branches.
 */
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Inserts a user row.
   *
   * @param {CreateUserRecord} user - Fully built user including hashed password.
   * @returns {Promise<User>} The persisted user.
   * @throws {ConflictException} When a unique index rejects the insert.
   */
  async create(user: CreateUserRecord): Promise<User> {
    try {
      // Persist only the allowlisted create fields; never trust extra keys.
      const row = await this.prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          password: user.password,
          verified: user.verified,
        },
      });
      return toDomainUser(row);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw conflictFromUniqueViolation(error);
      }
      throw error;
    }
  }

  /**
   * Lists every user ordered by id (stable for tests).
   *
   * @returns {Promise<User[]>} All users, or an empty array.
   */
  async findAll(): Promise<User[]> {
    const rows = await this.prisma.user.findMany({ orderBy: { id: 'asc' } });
    return rows.map(toDomainUser);
  }

  /**
   * Loads one user by primary key.
   *
   * @param {string} id - User UUID.
   * @returns {Promise<User | null>} The user, or null when missing.
   */
  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? toDomainUser(row) : null;
  }

  /**
   * Updates display name and/or password hash.
   *
   * @param {string} id - User UUID.
   * @param {UpdateUserRecord} data - Fields to change.
   * @returns {Promise<User>} The updated user.
   * @throws {NotFoundException} When Prisma reports no row for `id`.
   */
  async update(id: string, data: UpdateUserRecord): Promise<User> {
    try {
      const row = await this.prisma.user.update({
        where: { id },
        data: {
          ...(data.displayName !== undefined
            ? { displayName: data.displayName }
            : {}),
          ...(data.password !== undefined ? { password: data.password } : {}),
        },
      });
      return toDomainUser(row);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  /**
   * Deletes by id without throwing when the row is already gone.
   *
   * @param {string} id - User UUID.
   * @returns {Promise<void>}
   */
  async delete(id: string): Promise<void> {
    // deleteMany does not throw when zero rows match (DELETE is always 204).
    await this.prisma.user.deleteMany({ where: { id } });
  }
}
