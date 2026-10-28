import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaUserRepository } from './prisma-user.repository.js';
import type { PrismaService } from '../../persistence/prisma.service.js';
import type { CreateUserRecord } from './user.repository.js';

const row = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'ada@example.com',
  username: 'Ada_Lovelace',
  displayName: 'Ada Lovelace',
  password: 'hash(correct-horse)',
  verified: false,
};

const createRecord: CreateUserRecord = { ...row };

/**
 * Builds a Prisma P2002 unique-violation error for tests.
 *
 * @param {string | string[]} target - Constraint target from Prisma meta.
 * @returns {Prisma.PrismaClientKnownRequestError}
 */
function uniqueViolation(
  target: string | string[],
): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
    meta: { target },
  });
}

describe('PrismaUserRepository', () => {
  let repository: PrismaUserRepository;
  const prisma = {
    client: {
      user: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        deleteMany: vi.fn(),
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaUserRepository(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('maps the Prisma row to a domain user', async () => {
      prisma.client.user.create.mockResolvedValue(row);

      await expect(repository.create(createRecord)).resolves.toEqual(row);
      expect(prisma.client.user.create).toHaveBeenCalledWith({
        data: createRecord,
      });
    });

    it('maps email unique violations to ConflictException', async () => {
      prisma.client.user.create.mockRejectedValue(
        uniqueViolation('users_email_lower_key'),
      );

      await expect(repository.create(createRecord)).rejects.toEqual(
        new ConflictException('Email already in use'),
      );
    });

    it('maps username unique violations to ConflictException', async () => {
      prisma.client.user.create.mockRejectedValue(
        uniqueViolation(['users_username_lower_key']),
      );

      await expect(repository.create(createRecord)).rejects.toEqual(
        new ConflictException('Username already in use'),
      );
    });

    it('maps unknown unique targets to a generic ConflictException', async () => {
      prisma.client.user.create.mockRejectedValue(uniqueViolation('other_key'));

      await expect(repository.create(createRecord)).rejects.toEqual(
        new ConflictException('Email or username already in use'),
      );
    });

    it('maps column-name email targets to ConflictException', async () => {
      prisma.client.user.create.mockRejectedValue(uniqueViolation('email'));

      await expect(repository.create(createRecord)).rejects.toEqual(
        new ConflictException('Email already in use'),
      );
    });

    it('treats missing targets as a generic conflict', async () => {
      prisma.client.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
          meta: {},
        }),
      );

      await expect(repository.create(createRecord)).rejects.toEqual(
        new ConflictException('Email or username already in use'),
      );
    });

    it('rethrows non-unique Prisma errors', async () => {
      const error = new Error('connection lost');
      prisma.client.user.create.mockRejectedValue(error);

      await expect(repository.create(createRecord)).rejects.toBe(error);
    });

    it('rethrows known Prisma errors that are not unique violations', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('Deadlock', {
        code: 'P2034',
        clientVersion: 'test',
      });
      prisma.client.user.create.mockRejectedValue(error);

      await expect(repository.create(createRecord)).rejects.toBe(error);
    });
  });

  describe('findAll', () => {
    it('returns mapped users ordered by id', async () => {
      prisma.client.user.findMany.mockResolvedValue([row]);

      await expect(repository.findAll()).resolves.toEqual([row]);
      expect(prisma.client.user.findMany).toHaveBeenCalledWith({
        orderBy: { id: 'asc' },
      });
    });
  });

  describe('findById', () => {
    it('returns a domain user when found', async () => {
      prisma.client.user.findUnique.mockResolvedValue(row);

      await expect(repository.findById(row.id)).resolves.toEqual(row);
    });

    it('returns null when missing', async () => {
      prisma.client.user.findUnique.mockResolvedValue(null);

      await expect(repository.findById(row.id)).resolves.toBeNull();
    });
  });

  describe('update', () => {
    it('updates only provided fields', async () => {
      prisma.client.user.update.mockResolvedValue({
        ...row,
        displayName: 'Augusta',
      });

      await expect(
        repository.update(row.id, { displayName: 'Augusta' }),
      ).resolves.toMatchObject({ displayName: 'Augusta' });
      expect(prisma.client.user.update).toHaveBeenCalledWith({
        where: { id: row.id },
        data: { displayName: 'Augusta' },
      });
    });

    it('updates password when provided', async () => {
      prisma.client.user.update.mockResolvedValue({
        ...row,
        password: 'hash(new)',
      });

      await expect(
        repository.update(row.id, { password: 'hash(new)' }),
      ).resolves.toMatchObject({ password: 'hash(new)' });
      expect(prisma.client.user.update).toHaveBeenCalledWith({
        where: { id: row.id },
        data: { password: 'hash(new)' },
      });
    });

    it('updates displayName and password together', async () => {
      prisma.client.user.update.mockResolvedValue({
        ...row,
        displayName: 'Augusta',
        password: 'hash(new)',
      });

      await repository.update(row.id, {
        displayName: 'Augusta',
        password: 'hash(new)',
      });
      expect(prisma.client.user.update).toHaveBeenCalledWith({
        where: { id: row.id },
        data: { displayName: 'Augusta', password: 'hash(new)' },
      });
    });

    it('sends an empty data object when no fields are provided', async () => {
      prisma.client.user.update.mockResolvedValue(row);

      await repository.update(row.id, {});
      expect(prisma.client.user.update).toHaveBeenCalledWith({
        where: { id: row.id },
        data: {},
      });
    });

    it('maps P2025 to NotFoundException', async () => {
      prisma.client.user.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Record not found', {
          code: 'P2025',
          clientVersion: 'test',
        }),
      );

      await expect(
        repository.update(row.id, { displayName: 'Ada' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rethrows non-not-found errors from update', async () => {
      const error = new Error('timeout');
      prisma.client.user.update.mockRejectedValue(error);

      await expect(
        repository.update(row.id, { displayName: 'Ada' }),
      ).rejects.toBe(error);
    });
  });

  describe('delete', () => {
    it('uses deleteMany so missing ids are a no-op', async () => {
      prisma.client.user.deleteMany.mockResolvedValue({ count: 0 });

      await expect(repository.delete(row.id)).resolves.toBeUndefined();
      expect(prisma.client.user.deleteMany).toHaveBeenCalledWith({
        where: { id: row.id },
      });
    });
  });
});
