import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';
import { createPrismaPgAdapter } from './create-prisma-pg-adapter.js';

/**
 * Nest-managed wrapper around a Prisma Client for the process lifetime.
 *
 * Composes {@link PrismaClient} instead of extending it so the Nest service
 * stays a DI-owned dependency that holds the vendor client, matching the
 * project's composition style. Uses the Postgres driver adapter and connects
 * on module init so the pool does not leak across hot reloads or test teardown.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  /** Owned Prisma Client wired to `DATABASE_URL` via `@prisma/adapter-pg`. */
  readonly client: PrismaClient;

  /**
   * Creates a client wired to `DATABASE_URL` via `@prisma/adapter-pg`.
   */
  constructor() {
    this.client = new PrismaClient({ adapter: createPrismaPgAdapter() });
  }

  /**
   * Opens the database connection when the Nest module starts.
   *
   * @returns {Promise<void>}
   */
  async onModuleInit(): Promise<void> {
    // Connect so the first request does not pay cold-start connect latency alone.
    await this.client.$connect();
  }

  /**
   * Closes the database connection when the Nest module stops.
   *
   * @returns {Promise<void>}
   */
  async onModuleDestroy(): Promise<void> {
    // Disconnect so e2e and watch mode do not leave open pools behind.
    await this.client.$disconnect();
  }
}
