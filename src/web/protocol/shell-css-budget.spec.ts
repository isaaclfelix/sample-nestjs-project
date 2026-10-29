import {
  DEFAULT_SHELL_CSS_BUDGET_BYTES,
  shellCssBudgetBytes,
} from './shell-css-budget.js';

describe('shellCssBudgetBytes', () => {
  const previous = process.env.SHELL_CSS_BUDGET_BYTES;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.SHELL_CSS_BUDGET_BYTES;
    } else {
      process.env.SHELL_CSS_BUDGET_BYTES = previous;
    }
  });

  it('returns the default when the env var is unset', () => {
    delete process.env.SHELL_CSS_BUDGET_BYTES;

    expect(shellCssBudgetBytes()).toBe(DEFAULT_SHELL_CSS_BUDGET_BYTES);
  });

  it('returns the default when the env var is empty', () => {
    process.env.SHELL_CSS_BUDGET_BYTES = '';

    expect(shellCssBudgetBytes()).toBe(DEFAULT_SHELL_CSS_BUDGET_BYTES);
  });

  it('returns a positive integer override', () => {
    process.env.SHELL_CSS_BUDGET_BYTES = '4096';

    expect(shellCssBudgetBytes()).toBe(4096);
  });

  it('returns the default for non-numeric values', () => {
    process.env.SHELL_CSS_BUDGET_BYTES = 'not-a-number';

    expect(shellCssBudgetBytes()).toBe(DEFAULT_SHELL_CSS_BUDGET_BYTES);
  });

  it('returns the default for zero and negative values', () => {
    process.env.SHELL_CSS_BUDGET_BYTES = '0';
    expect(shellCssBudgetBytes()).toBe(DEFAULT_SHELL_CSS_BUDGET_BYTES);

    process.env.SHELL_CSS_BUDGET_BYTES = '-1';
    expect(shellCssBudgetBytes()).toBe(DEFAULT_SHELL_CSS_BUDGET_BYTES);
  });
});
