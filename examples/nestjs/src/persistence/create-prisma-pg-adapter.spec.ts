import { createPrismaPgAdapter } from './create-prisma-pg-adapter.js';

describe('createPrismaPgAdapter', () => {
  const previousUrl = process.env.DATABASE_URL;

  afterEach(() => {
    if (previousUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousUrl;
    }
  });

  it('throws when DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL;

    expect(() => createPrismaPgAdapter()).toThrow('DATABASE_URL is required');
  });

  it('returns a PrismaPg adapter when DATABASE_URL is set', () => {
    process.env.DATABASE_URL =
      'postgresql://app:app@localhost:5432/app?schema=public';

    const adapter = createPrismaPgAdapter();
    expect(adapter).toBeDefined();
  });
});
