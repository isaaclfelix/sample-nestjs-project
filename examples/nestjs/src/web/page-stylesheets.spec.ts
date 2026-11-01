import { pageStylesheetsByPage } from './page-stylesheets.js';

describe('app page stylesheets', () => {
  it('opts login and register into forms and leaves home empty', () => {
    expect(pageStylesheetsByPage.home).toEqual([]);
    expect(pageStylesheetsByPage.login).toEqual(['forms']);
    expect(pageStylesheetsByPage.register).toEqual(['forms']);
  });
});
