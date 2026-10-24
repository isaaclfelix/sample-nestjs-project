import { User } from './entities/user.entity.js';
import { UserResponseDto } from './dto/user-response.dto.js';

/**
 * Maps a stored user to the public API shape.
 *
 * Copies only allowlisted fields so the password hash never appears in responses.
 *
 * @param {User} user - The persisted user document.
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
