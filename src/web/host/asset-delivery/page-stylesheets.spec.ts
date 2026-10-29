import {
  isPageStylesheetName,
  pageStylesheetRegistration,
  pageStylesheetsByPage,
} from './page-stylesheets.js';

describe('page stylesheets', () => {
  it('recognizes registered stylesheet names', () => {
    expect(isPageStylesheetName('forms')).toBe(true);
    expect(isPageStylesheetName('shell')).toBe(false);
    expect(isPageStylesheetName('toString')).toBe(false);
  });

  it('returns the registration for a known stylesheet', () => {
    expect(pageStylesheetRegistration('forms')).toEqual({
      source: 'src/web/ui/styles/forms.scss',
      devUrl: '/src/web/ui/styles/forms.scss',
    });
  });

  it('opts login and register into forms and leaves home empty', () => {
    expect(pageStylesheetsByPage.home).toEqual([]);
    expect(pageStylesheetsByPage.login).toEqual(['forms']);
    expect(pageStylesheetsByPage.register).toEqual(['forms']);
  });
});
