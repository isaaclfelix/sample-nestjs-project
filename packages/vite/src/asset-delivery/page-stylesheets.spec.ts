import {
  isPageStylesheetName,
  pageStylesheetRegistration,
  setPageStylesheetRegistry,
} from './page-stylesheets.js';

describe('page stylesheets', () => {
  beforeEach(() => {
    setPageStylesheetRegistry({
      forms: {
        source: 'src/web/ui/styles/forms.scss',
        devUrl: '/src/web/ui/styles/forms.scss',
      },
    });
  });

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

  it('throws for an unregistered stylesheet name', () => {
    expect(() => pageStylesheetRegistration('missing')).toThrow(
      /Unknown page stylesheet "missing"/,
    );
  });
});
