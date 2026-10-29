import { apiRequestDefaults } from './api-request-defaults';

describe('apiRequestDefaults', () => {
  it('uses same-origin credentials and JSON content type', () => {
    expect(apiRequestDefaults).toEqual({
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });
});
