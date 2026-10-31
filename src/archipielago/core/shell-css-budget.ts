/** Default shell CSS gzip budget: 50 KiB. Override with SHELL_CSS_BUDGET_BYTES. */
export const DEFAULT_SHELL_CSS_BUDGET_BYTES = 50 * 1024;

/**
 * Reads the configurable shell CSS gzip budget in bytes.
 *
 * Uses `SHELL_CSS_BUDGET_BYTES` when set to a positive integer; otherwise
 * {@link DEFAULT_SHELL_CSS_BUDGET_BYTES}. Invalid values fall back to the default.
 *
 * Shared by the Nest host (inline vs link) and the Vite shell budget plugin.
 *
 * @returns {number} Budget in bytes for the gzipped shell stylesheet.
 */
export function shellCssBudgetBytes(): number {
  const raw = process.env.SHELL_CSS_BUDGET_BYTES;

  if (raw === undefined || raw === '') {
    return DEFAULT_SHELL_CSS_BUDGET_BYTES;
  }

  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_SHELL_CSS_BUDGET_BYTES;
  }

  return parsed;
}
