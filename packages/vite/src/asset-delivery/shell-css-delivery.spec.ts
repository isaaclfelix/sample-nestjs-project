import { chooseShellDelivery } from './shell-css-delivery.js';

describe('chooseShellDelivery', () => {
  it('inlines when raw CSS fits the budget', () => {
    const css = '.ok{color:red}';
    const budget = Buffer.byteLength(css, 'utf8');

    expect(chooseShellDelivery(css, budget)).toEqual({
      mode: 'inline',
      css,
    });
  });

  it('links when raw CSS exceeds the budget', () => {
    const budget = 8;
    const css = 'x'.repeat(budget + 1);

    expect(chooseShellDelivery(css, budget)).toEqual({ mode: 'link' });
  });

  it('flips mode when the budget changes for fixed CSS', () => {
    const css = 'body{margin:0}';
    const raw = Buffer.byteLength(css, 'utf8');

    expect(chooseShellDelivery(css, raw).mode).toBe('inline');
    expect(chooseShellDelivery(css, raw - 1).mode).toBe('link');
  });
});
