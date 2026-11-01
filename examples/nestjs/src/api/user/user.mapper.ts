import { User } from './entities/user.entity.js';
import { UserResponseDto } from './dto/user-response.dto.js';

/**
 * Structural shape of a persisted user row (Prisma or equivalent).
 *
 * Kept as a plain object type so the mapper does not import generated Prisma
 * Client types; only the repository adapter talks to Prisma.
 */
export type UserPersistenceRow = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  password: string;
  verified: boolean;
};

/**
 * Maps a persisted user row to the domain {@link User} type.
 *
 * Allowlists fields so unknown store columns never leak into the domain.
 *
 * @param {UserPersistenceRow} row - Raw persistence user record.
 * @returns {User} Persistence-agnostic user.
 */
export function toDomainUser(row: UserPersistenceRow): User {
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
 * Maps a stored user to the public API shape.
 *
 * Copies only allowlisted fields so the password hash never appears in responses.
 *
 * @param {User} user - The persisted domain user.
 * @returns {UserResponseDto} Public fields: id, email, username, displayName, verified.
 */
export function toUserResponseDto(user: User): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    verified: user.verified,
  };
}
