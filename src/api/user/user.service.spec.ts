import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service.js';
import { hashPassword } from '../common/password.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { USER_REPOSITORY, type UserRepository } from './user.repository.js';
import type { User } from './entities/user.entity.js';

vi.mock('../common/password.js', () => ({
  hashPassword: vi.fn(async (plaintext: string) => `hash(${plaintext})`),
}));

const createUserDto: CreateUserDto = {
  email: 'ada@example.com',
  username: 'Ada_Lovelace',
  displayName: 'Ada Lovelace',
  password: 'correct-horse',
};

/**
 * Builds a domain user matching create defaults for repository mock returns.
 *
 * @param {Partial<User>} overrides - Fields to override.
 * @returns {User} Domain user.
 */
function storedUser(overrides: Partial<User> = {}): User {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    email: createUserDto.email,
    username: createUserDto.username,
    displayName: createUserDto.displayName,
    password: 'hash(correct-horse)',
    verified: false,
    ...overrides,
  };
}

describe('UserService', () => {
  let service: UserService;
  const users: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  } = {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: USER_REPOSITORY, useValue: users satisfies UserRepository },
      ],
    }).compile();

    service = module.get(UserService);
  });

  describe('create', () => {
    it('stores a hashed password and returns a public user without the hash', async () => {
      users.create.mockImplementation(async (user: User) => user);

      const created = await service.create(createUserDto);

      expect(hashPassword).toHaveBeenCalledWith('correct-horse');
      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'ada@example.com',
          username: 'Ada_Lovelace',
          displayName: 'Ada Lovelace',
          password: 'hash(correct-horse)',
          verified: false,
        }),
      );
      expect(created).toMatchObject({
        email: 'ada@example.com',
        username: 'Ada_Lovelace',
        displayName: 'Ada Lovelace',
        verified: false,
      });
      expect(created.id).toEqual(expect.any(String));
      expect(created).not.toHaveProperty('password');
    });

    it('assigns a unique id per user', async () => {
      users.create.mockImplementation(async (user: User) => user);

      const first = await service.create(createUserDto);
      const second = await service.create({
        ...createUserDto,
        email: 'second@example.com',
        username: 'SecondUser',
      });

      expect(first.id).not.toBe(second.id);
    });

    it('propagates ConflictException from the repository', async () => {
      users.create.mockRejectedValue(
        new ConflictException('Email already in use'),
      );

      await expect(service.create(createUserDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('ignores extra DTO properties and always generates id and verified', async () => {
      users.create.mockImplementation(async (user: User) => user);

      const created = await service.create({
        ...createUserDto,
        id: '00000000-0000-4000-8000-000000000000',
        verified: true,
      } as CreateUserDto);

      expect(created.id).not.toBe('00000000-0000-4000-8000-000000000000');
      expect(created.id).toEqual(expect.any(String));
      expect(created.verified).toBe(false);
      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({ verified: false }),
      );
    });
  });

  describe('findAll', () => {
    it('returns an empty list when no users exist', async () => {
      users.findAll.mockResolvedValue([]);
      await expect(service.findAll()).resolves.toEqual([]);
    });

    it('returns every stored user without passwords', async () => {
      users.findAll.mockResolvedValue([
        storedUser(),
        storedUser({
          id: '22222222-2222-4222-8222-222222222222',
          email: 'second@example.com',
          username: 'SecondUser',
        }),
      ]);

      const listed = await service.findAll();
      expect(listed).toHaveLength(2);
      for (const user of listed) {
        expect(user).not.toHaveProperty('password');
      }
    });
  });

  describe('findOne', () => {
    it('returns the matching user', async () => {
      const user = storedUser();
      users.findById.mockResolvedValue(user);

      await expect(service.findOne(user.id)).resolves.toEqual({
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        verified: user.verified,
      });
    });

    it('throws NotFoundException for an unknown id', async () => {
      users.findById.mockResolvedValue(null);

      await expect(
        service.findOne('11111111-1111-4111-8111-111111111111'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates displayName and leaves other public fields unchanged', async () => {
      const user = storedUser();
      users.findById.mockResolvedValue(user);
      users.update.mockResolvedValue(
        storedUser({ displayName: 'Augusta Ada' }),
      );

      const updated = await service.update(user.id, {
        displayName: 'Augusta Ada',
      });

      expect(updated.displayName).toBe('Augusta Ada');
      expect(updated.email).toBe(user.email);
      expect(updated.username).toBe(user.username);
      expect(hashPassword).not.toHaveBeenCalled();
      expect(users.update).toHaveBeenCalledWith(user.id, {
        displayName: 'Augusta Ada',
      });
    });

    it('re-hashes when a new password is provided', async () => {
      const user = storedUser();
      users.findById.mockResolvedValue(user);
      users.update.mockResolvedValue(user);
      vi.mocked(hashPassword).mockClear();

      await service.update(user.id, { password: 'correct-horse-2' });

      expect(hashPassword).toHaveBeenCalledOnce();
      expect(hashPassword).toHaveBeenCalledWith('correct-horse-2');
      expect(users.update).toHaveBeenCalledWith(user.id, {
        password: 'hash(correct-horse-2)',
      });
    });

    it('does not apply email or username even if present at runtime', async () => {
      const user = storedUser();
      users.findById.mockResolvedValue(user);
      users.update.mockResolvedValue(storedUser({ displayName: 'Ada' }));

      const updated = await service.update(user.id, {
        email: 'new@example.com',
        username: 'new_handle',
        displayName: 'Ada',
      } as { email: string; username: string; displayName: string });

      expect(updated.email).toBe(user.email);
      expect(updated.username).toBe(user.username);
      expect(users.update).toHaveBeenCalledWith(user.id, {
        displayName: 'Ada',
      });
    });

    it('throws NotFoundException for an unknown id', async () => {
      users.findById.mockResolvedValue(null);

      await expect(
        service.update('11111111-1111-4111-8111-111111111111', {
          displayName: 'Ada',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(users.update).not.toHaveBeenCalled();
    });

    it('does not mutate the previous public DTO snapshot', async () => {
      const user = storedUser();
      const changed = storedUser({ displayName: 'Changed' });
      // findOne → update's getById → findOne after update
      users.findById
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(changed);
      users.update.mockResolvedValue(changed);

      const before = await service.findOne(user.id);
      await service.update(user.id, { displayName: 'Changed' });
      const after = await service.findOne(user.id);

      expect(before.displayName).toBe('Ada Lovelace');
      expect(after.displayName).toBe('Changed');
    });
  });

  describe('remove', () => {
    it('deletes an existing user so findOne then 404s', async () => {
      const user = storedUser();
      users.delete.mockResolvedValue(undefined);
      users.findById.mockResolvedValue(null);

      await service.remove(user.id);

      expect(users.delete).toHaveBeenCalledWith(user.id);
      await expect(service.findOne(user.id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('is a no-op for an unknown id (does not throw)', async () => {
      users.delete.mockResolvedValue(undefined);

      await expect(
        service.remove('11111111-1111-4111-8111-111111111111'),
      ).resolves.toBeUndefined();
    });
  });
});
