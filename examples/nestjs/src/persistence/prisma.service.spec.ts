import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaService } from './prisma.service.js';

describe('PrismaService', () => {
  it('connects on module init and disconnects on destroy', async () => {
    process.env.DATABASE_URL =
      process.env.DATABASE_URL ??
      'postgresql://app:app@localhost:5432/app?schema=public';

    const connect = vi
      .spyOn(PrismaClient.prototype, '$connect')
      .mockResolvedValue();
    const disconnect = vi
      .spyOn(PrismaClient.prototype, '$disconnect')
      .mockResolvedValue();

    const service = new PrismaService();

    await service.onModuleInit();
    await service.onModuleDestroy();

    expect(connect).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalledOnce();

    connect.mockRestore();
    disconnect.mockRestore();
  });
});
