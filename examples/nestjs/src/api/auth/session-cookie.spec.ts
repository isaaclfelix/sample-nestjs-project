import type { Request, Response } from 'express';
import {
  clearSessionCookie,
  parseCookieHeader,
  readSessionId,
  setSessionCookie,
} from './session-cookie.js';
import { SESSION_COOKIE_NAME } from './session.constants.js';

describe('session-cookie', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('parseCookieHeader', () => {
    it('returns an empty object when the header is missing', () => {
      expect(parseCookieHeader(undefined)).toEqual({});
    });

    it('parses name/value pairs and skips empty or malformed parts', () => {
      expect(
        parseCookieHeader(
          ` ${SESSION_COOKIE_NAME}=abc%20123 ; ; broken ; =novalue ; ok=yes `,
        ),
      ).toEqual({
        [SESSION_COOKIE_NAME]: 'abc 123',
        ok: 'yes',
      });
    });
  });

  describe('readSessionId', () => {
    it('returns the sid cookie when present', () => {
      const req = {
        headers: { cookie: `${SESSION_COOKIE_NAME}=session-1` },
      } as Request;

      expect(readSessionId(req)).toBe('session-1');
    });

    it('returns undefined when the sid cookie is missing or empty', () => {
      expect(readSessionId({ headers: {} } as Request)).toBeUndefined();
      expect(
        readSessionId({
          headers: { cookie: `${SESSION_COOKIE_NAME}=` },
        } as Request),
      ).toBeUndefined();
    });
  });

  describe('setSessionCookie', () => {
    it('appends an HttpOnly Lax cookie without Secure outside production', () => {
      process.env.NODE_ENV = 'development';
      const append = vi.fn();
      const res = { append } as unknown as Response;
      const expiresAt = new Date('2030-01-01T00:00:00.000Z');

      setSessionCookie(res, 'sid-value', expiresAt);

      expect(append).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.stringContaining(`${SESSION_COOKIE_NAME}=sid-value`),
      );
      expect(append.mock.calls[0][1]).toContain('HttpOnly');
      expect(append.mock.calls[0][1]).toContain('SameSite=Lax');
      expect(append.mock.calls[0][1]).not.toContain('Secure');
    });

    it('adds Secure in production', () => {
      process.env.NODE_ENV = 'production';
      const append = vi.fn();
      const res = { append } as unknown as Response;

      setSessionCookie(res, 'sid', new Date('2030-01-01T00:00:00.000Z'));

      expect(append.mock.calls[0][1]).toContain('Secure');
    });
  });

  describe('clearSessionCookie', () => {
    it('expires the cookie and omits Secure outside production', () => {
      process.env.NODE_ENV = 'test';
      const append = vi.fn();
      const res = { append } as unknown as Response;

      clearSessionCookie(res);

      expect(append.mock.calls[0][1]).toContain(
        'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      );
      expect(append.mock.calls[0][1]).not.toContain('Secure');
    });

    it('adds Secure when clearing in production', () => {
      process.env.NODE_ENV = 'production';
      const append = vi.fn();
      const res = { append } as unknown as Response;

      clearSessionCookie(res);

      expect(append.mock.calls[0][1]).toContain('Secure');
    });
  });
});
