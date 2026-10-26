/**
 * Domain user persisted by the repository port.
 *
 * Independent of Prisma's generated model; adapters map to and from this shape.
 */
export type User = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  /** Encoded Argon2id record; never returned on the public API. */
  password: string;
  verified: boolean;
};
