import { User } from './entities/user.entity.js';
import { UserResponseDto } from './dto/user-response.dto.js';

export function toUserResponseDto(user: User): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    verified: user.verified,
  };
}
