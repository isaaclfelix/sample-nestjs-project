import { User } from './entities/user.entity.js';

/** Nest injection token for {@link UserRepository}. */
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

/**
 * Fields required to insert a new user row.
 *
 * Built by the service (hashed password, generated id); the adapter persists them.
 */
export type CreateUserRecord = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  password: string;
  verified: boolean;
};

/**
 * Partial persistence update. Email and username are immutable here.
 */
export type UpdateUserRecord = {
  displayName?: string;
  password?: string;
};

/**
 * Persistence port for users.
 *
 * Application code depends on this interface; Prisma (or another store) implements it.
 */
export interface UserRepository {
  /**
   * Inserts a user and returns the stored domain record.
   *
   * @param {CreateUserRecord} user - Fully built user including hashed password.
   * @returns {Promise<User>} The persisted user.
   * @throws {ConflictException} When email or username uniqueness fails.
   */
  create(user: CreateUserRecord): Promise<User>;

  /**
   * Lists all users in stable insertion order when the store provides it.
   *
   * @returns {Promise<User[]>} Every stored user, or an empty array.
   */
  findAll(): Promise<User[]>;

  /**
   * Loads one user by id.
   *
   * @param {string} id - User UUID.
   * @returns {Promise<User | null>} The user, or null when missing.
   */
  findById(id: string): Promise<User | null>;

  /**
   * Loads one user by email or username (case-insensitive).
   *
   * Used by login when the client sends a single identifier field.
   *
   * @param {string} identifier - Email or username as typed by the user.
   * @returns {Promise<User | null>} The user, or null when no match.
   */
  findByEmailOrUsername(identifier: string): Promise<User | null>;

  /**
   * Applies a partial update and returns the new stored row.
   *
   * @param {string} id - User UUID.
   * @param {UpdateUserRecord} data - Fields to change.
   * @returns {Promise<User>} The updated user.
   * @throws {NotFoundException} When no user exists for `id`.
   */
  update(id: string, data: UpdateUserRecord): Promise<User>;

  /**
   * Deletes a user by id. Missing ids are a no-op.
   *
   * @param {string} id - User UUID.
   * @returns {Promise<void>}
   */
  delete(id: string): Promise<void>;
}
