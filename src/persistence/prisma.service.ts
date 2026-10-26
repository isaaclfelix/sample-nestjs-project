import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';
import { createPrismaPgAdapter } from './create-prisma-pg-adapter.js';

/**
 * Nest-managed Prisma client for the process lifetime.
 *
 * Uses the Postgres driver adapter and connects on module init so the pool
 * does not leak across hot reloads or test app teardown.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Creates a client wired to `DATABASE_URL` via `@prisma/adapter-pg`.
   */
  constructor() {
    super({ adapter: createPrismaPgAdapter() });
  }

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
