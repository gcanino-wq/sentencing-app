/** Formats a number of dollars the way the worksheets print it. */
export const money = (n: number | string): string =>
  '$' + Number(n || 0).toLocaleString('en-US');

/** Signed level adjustment, e.g. +2 / 0 / -4. */
export const sgn = (n: number): string => (n > 0 ? '+' + n : String(n));
