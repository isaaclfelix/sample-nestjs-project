import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service.js';
import { hashPassword } from '../common/password.js';
import { CreateUserDto } from './dto/create-user.dto.js';

vi.mock('../common/password.js', () => ({
  hashPassword: vi.fn(async (plaintext: string) => `hash(${plaintext})`),
}));

const createUserDto: CreateUserDto = {
  email: 'ada@example.com',
  username: 'Ada_Lovelace',
  displayName: 'Ada Lovelace',
  password: 'password1',
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    service = module.get(UserService);
  });

  describe('create', () => {
    it('stores a hashed password and returns a public user without the hash', async () => {
      const created = await service.create(createUserDto);

      expect(hashPassword).toHaveBeenCalledWith('password1');
      expect(created).toMatchObject({
        email: 'ada@example.com',
        username: 'Ada_Lovelace',
        displayName: 'Ada Lovelace',
        verified: false,
      });
      expect(created.id).toEqual(expect.any(String));
      expect(created).not.toHaveProperty('password');
      expect(created.verified).toBe(false);
    });

    it('assigns a unique id per user', async () => {
      const first = await service.create(createUserDto);
      const second = await service.create({
        ...createUserDto,
        email: 'second@example.com',
        username: 'SecondUser',
      });

      expect(first.id).not.toBe(second.id);
    });

    it('currently allows duplicate emails and usernames', async () => {
      const first = await service.create(createUserDto);
      const second = await service.create(createUserDto);

      expect(first.id).not.toBe(second.id);
      expect(second.email).toBe(first.email);
      expect(second.username).toBe(first.username);
    });

    it('currently lets extra DTO properties overwrite the generated id (Zod is the only strip)', async () => {
      const created = await service.create({
        ...createUserDto,
        id: '00000000-0000-4000-8000-000000000000',
        verified: true,
      } as CreateUserDto);

      expect(created.id).toBe('00000000-0000-4000-8000-000000000000');
      expect(created.verified).toBe(false);
    });
  });

  describe('findAll', () => {
    it('returns an empty list when no users exist', () => {
      expect(service.findAll()).toEqual([]);
    });

    it('returns every created user without passwords', async () => {
      await service.create(createUserDto);
      await service.create({
        ...createUserDto,
        email: 'second@example.com',
        username: 'SecondUser',
      });

      const users = service.findAll();
      expect(users).toHaveLength(2);
      for (const user of users) {
        expect(user).not.toHaveProperty('password');
      }
    });
  });

  describe('findOne', () => {
    it('returns the matching user', async () => {
      const created = await service.create(createUserDto);

      expect(service.findOne(created.id)).toEqual(created);
    });

    it('throws NotFoundException for an unknown id', () => {
      expect(() =>
        service.findOne('11111111-1111-4111-8111-111111111111'),
      ).toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates displayName and leaves other public fields unchanged', async () => {
      const created = await service.create(createUserDto);

      const updated = await service.update(created.id, {
        displayName: 'Augusta Ada',
      });

      expect(updated.displayName).toBe('Augusta Ada');
      expect(updated.email).toBe(created.email);
      expect(updated.username).toBe(created.username);
      expect(updated.verified).toBe(false);
      expect(hashPassword).toHaveBeenCalledTimes(1);
    });

    it('re-hashes when a new password is provided', async () => {
      const created = await service.create(createUserDto);
      vi.mocked(hashPassword).mockClear();

      await service.update(created.id, { password: 'new-password' });

      expect(hashPassword).toHaveBeenCalledOnce();
      expect(hashPassword).toHaveBeenCalledWith('new-password');
    });

    it('does not apply email or username even if present on the DTO type at runtime', async () => {
      const created = await service.create(createUserDto);

      const updated = await service.update(created.id, {
        email: 'new@example.com',
        username: 'new_handle',
        displayName: 'Ada',
      } as { email: string; username: string; displayName: string });

      expect(updated.email).toBe(created.email);
      expect(updated.username).toBe(created.username);
      expect(updated.displayName).toBe('Ada');
    });

    it('throws NotFoundException for an unknown id', async () => {
      await expect(
        service.update('11111111-1111-4111-8111-111111111111', {
          displayName: 'Ada',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('does not mutate the previous stored snapshot identity beyond the Map entry', async () => {
      const created = await service.create(createUserDto);
      const before = service.findOne(created.id);

      await service.update(created.id, { displayName: 'Changed' });

      expect(before.displayName).toBe('Ada Lovelace');
      expect(service.findOne(created.id).displayName).toBe('Changed');
    });
  });

  describe('remove', () => {
    it('deletes an existing user so findOne then 404s', async () => {
      const created = await service.create(createUserDto);

      service.remove(created.id);

      expect(() => service.findOne(created.id)).toThrow(NotFoundException);
      expect(service.findAll()).toEqual([]);
    });

    it('is a no-op for an unknown id (does not throw)', () => {
      expect(() =>
        service.remove('11111111-1111-4111-8111-111111111111'),
      ).not.toThrow();
    });
  });
});
