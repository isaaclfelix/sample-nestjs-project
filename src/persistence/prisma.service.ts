import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Nest-managed Prisma client for the process lifetime.
 *
 * Connects on module init and disconnects on destroy so the pool does not
 * leak across hot reloads or test app teardown.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Opens the database connection when the Nest module starts.
   *
   * @returns {Promise<void>}
   */
  async onModuleInit(): Promise<void> {
    // Connect so the first request does not pay cold-start connect latency alone.
    await this.$connect();
  }

  /**
   * Closes the database connection when the Nest module stops.
   *
   * @returns {Promise<void>}
   */
  async onModuleDestroy(): Promise<void> {
    // Disconnect so e2e and watch mode do not leave open pools behind.
    await this.$disconnect();
  }
}
