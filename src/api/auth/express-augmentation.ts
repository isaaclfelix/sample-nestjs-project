import type { AppSession } from './session.js';

declare global {
  namespace Express {
    interface Request {
      /** Cookie-backed session when SessionMiddleware attached one. */
      session?: AppSession;
    }
  }
}

/** Side-effect import target so TypeScript loads the Express Request augmentation. */
export const expressSessionAugmented = true;
