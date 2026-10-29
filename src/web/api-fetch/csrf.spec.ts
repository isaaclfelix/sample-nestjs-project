import { CSRF_META_NAME } from '../../api/auth/session.constants.js';
import { getCsrfToken, getCsrfTokenHeader } from './csrf.js';

describe('csrf helpers', () => {
  afterEach(() => {
    document.head.innerHTML = '';
  });

  it('reads the token from the csrf meta tag', () => {
    document.head.innerHTML = `<meta name="${CSRF_META_NAME}" content="tok-1" />`;

    expect(getCsrfToken()).toBe('tok-1');
    expect(getCsrfTokenHeader()).toEqual({ 'X-CSRF-TOKEN': 'tok-1' });
  });

  it('throws when the meta tag is missing', () => {
    expect(() => getCsrfToken()).toThrow('Missing CSRF meta token');
  });

  it('throws when the meta content is empty', () => {
    document.head.innerHTML = `<meta name="${CSRF_META_NAME}" content="" />`;

    expect(() => getCsrfToken()).toThrow('Missing CSRF meta token');
  });
});
