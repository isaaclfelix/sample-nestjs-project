import { shouldAttachSession } from './session-path.js';

describe('shouldAttachSession', () => {
  it.each(['/api', '/api/user', '/', '/login', '/register'])(
    'returns true for %s',
    (path) => {
      expect(shouldAttachSession(path)).toBe(true);
    },
  );

  it.each([
    '/@vite/client',
    '/src/web/styles/shell.scss',
    '/assets/hydrate.js',
    '/favicon.ico',
  ])('returns false for %s', (path) => {
    expect(shouldAttachSession(path)).toBe(false);
  });
});
