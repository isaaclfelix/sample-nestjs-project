import { NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../persistence/prisma.service.js';
import type { User } from './entities/user.entity.js';
import { conflictFromUniqueViolation } from './prisma-unique-conflict.js';
import { toDomainUser } from './user.mapper.js';
import type {
  CreateUserRecord,
  UpdateUserRecord,
  UserRepository,
} from './user.repository.js';

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
      const row = await this.prisma.client.user.create({
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
   * Loads one user by primary key.
   *
   * @param {string} id - User UUID.
   * @returns {Promise<User | null>} The user, or null when missing.
   */
  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.client.user.findUnique({ where: { id } });
    return row ? toDomainUser(row) : null;
  }

  /**
   * Finds a user whose email or username matches the identifier (insensitive).
   *
   * @param {string} identifier - Email or username.
   * @returns {Promise<User | null>} The matching user, or null.
   */
  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    const row = await this.prisma.client.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          { username: { equals: identifier, mode: 'insensitive' } },
        ],
      },
    });
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
      const row = await this.prisma.client.user.update({
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
    await this.prisma.client.user.deleteMany({ where: { id } });
  }
}
