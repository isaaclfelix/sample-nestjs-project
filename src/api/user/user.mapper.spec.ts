import { toUserResponseDto } from './user.mapper.js';
import { User } from './entities/user.entity.js';

describe('toUserResponseDto', () => {
  const user: User = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'ada@example.com',
    username: 'Ada_Lovelace',
    displayName: 'Ada Lovelace',
    password: 'argon2id$should-never-leak',
    verified: false,
  };

  it('copies public fields and omits the password hash', () => {
    expect(toUserResponseDto(user)).toEqual({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      verified: false,
    });
    expect(toUserResponseDto(user)).not.toHaveProperty('password');
  });
});
