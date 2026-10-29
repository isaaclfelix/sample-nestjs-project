import type { PrismaService } from '../../persistence/prisma.service.js';
import { SessionService } from './session.service.js';

describe('SessionService', () => {
  const session = {
    findUnique: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(),
  };
  const prisma = {
    client: { session },
  } as unknown as PrismaService;
  let service: SessionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SessionService(prisma);
  });

  describe('createGuest', () => {
    it('inserts a session with null userId', async () => {
      const expiresAt = new Date('2030-01-01T00:00:00.000Z');
      session.create.mockImplementation(
        async ({ data }: { data: Record<string, unknown> }) => ({
          ...data,
          expiresAt,
        }),
      );

      const created = await service.createGuest();

      expect(created.userId).toBeNull();
      expect(created.id).toEqual(expect.any(String));
      expect(created.csrfToken).toEqual(expect.any(String));
      expect(session.create).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('returns null when the row is missing', async () => {
      session.findUnique.mockResolvedValue(null);

      await expect(service.findById('missing')).resolves.toBeNull();
    });

    it('deletes and returns null when the row is expired', async () => {
      session.findUnique.mockResolvedValue({
        id: 'old',
        userId: null,
        csrfToken: 't',
        expiresAt: new Date('2000-01-01T00:00:00.000Z'),
      });
      session.delete.mockResolvedValue({});

      await expect(service.findById('old')).resolves.toBeNull();
      expect(session.delete).toHaveBeenCalledWith({ where: { id: 'old' } });
    });

    it('ignores delete failures for already-gone expired rows', async () => {
      session.findUnique.mockResolvedValue({
        id: 'old',
        userId: null,
        csrfToken: 't',
        expiresAt: new Date('2000-01-01T00:00:00.000Z'),
      });
      session.delete.mockRejectedValue(new Error('already gone'));

      await expect(service.findById('old')).resolves.toBeNull();
    });

    it('returns a live session', async () => {
      const row = {
        id: 'live',
        userId: 'user-1',
        csrfToken: 'csrf',
        expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      };
      session.findUnique.mockResolvedValue(row);

      await expect(service.findById('live')).resolves.toEqual(row);
      expect(session.delete).not.toHaveBeenCalled();
    });
  });

  describe('regenerate', () => {
    it('deletes the previous id when provided then inserts', async () => {
      session.delete.mockResolvedValue({});
      session.create.mockImplementation(
        async ({ data }: { data: Record<string, unknown> }) => ({
          ...data,
          expiresAt: new Date('2030-01-01T00:00:00.000Z'),
        }),
      );

      const next = await service.regenerate('prev', 'user-1');

      expect(session.delete).toHaveBeenCalledWith({ where: { id: 'prev' } });
      expect(next.userId).toBe('user-1');
    });

    it('skips delete when previousId is null and ignores delete errors', async () => {
      session.create.mockImplementation(
        async ({ data }: { data: Record<string, unknown> }) => ({
          ...data,
          expiresAt: new Date('2030-01-01T00:00:00.000Z'),
        }),
      );

      await service.regenerate(null, null);
      expect(session.delete).not.toHaveBeenCalled();

      session.delete.mockRejectedValue(new Error('gone'));
      await expect(service.regenerate('prev', null)).resolves.toMatchObject({
        userId: null,
      });
    });
  });

  describe('destroy', () => {
    it('deletes by id and ignores missing rows', async () => {
      session.delete.mockResolvedValue({});
      await service.destroy('sid');
      expect(session.delete).toHaveBeenCalledWith({ where: { id: 'sid' } });

      session.delete.mockRejectedValue(new Error('gone'));
      await expect(service.destroy('sid')).resolves.toBeUndefined();
    });
  });
});
