/**
 * In-memory view of a persisted session row attached to the request.
 */
export type AppSession = {
  id: string;
  userId: string | null;
  csrfToken: string;
  expiresAt: Date;
};
