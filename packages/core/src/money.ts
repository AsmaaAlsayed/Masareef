import { getCurrency, type CurrencyCode } from './currencies.js';

/** The largest amount one expense may have, in any currency (FR-010 criterion 3, RA-10). */
export const MAX_AMOUNT = '9999999.99';

export type ToMinorRejection =
  'empty' | 'not_a_number' | 'not_positive' | 'too_many_decimals' | 'above_maximum';

export type ToMinorResult =
  | { readonly ok: true; readonly minor: number }
  | { readonly ok: false; readonly reason: ToMinorRejection };

// Western digits only, with an optional sign and an optional fraction. No grouping
// separators, spaces or exponents: the input is rejected, not repaired.
const DECIMAL = /^(-?)([0-9]+)(?:\.([0-9]+))?$/;

const [MAX_WHOLE = '', MAX_FRACTION = ''] = MAX_AMOUNT.split('.');

// Digit strings are joined and read as one integer, so no fractional arithmetic ever happens.
function scale(whole: string, fraction: string, decimals: number): number {
  return Number(whole + fraction.padEnd(decimals, '0'));
}

const reject = (reason: ToMinorRejection): ToMinorResult => ({ ok: false, reason });

/**
 * Converts a decimal string such as "50" or "1.250" to an integer in the currency's minor
 * unit (piastres for EGP, fils for KWD), applying the amount rules of FR-010 criteria 3 and 4.
 * Digits in other scripts are not accepted here; convert them first with `toWesternDigits`.
 */
export function toMinor(text: string, currency: CurrencyCode): ToMinorResult {
  if (text === '') {
    return reject('empty');
  }
  const match = DECIMAL.exec(text);
  if (match === null) {
    return reject('not_a_number');
  }
  const [, sign, digits = '', fraction = ''] = match;
  if (sign === '-') {
    return reject('not_positive');
  }
  const { decimals } = getCurrency(currency);
  if (fraction.length > decimals) {
    return reject('too_many_decimals');
  }
  const whole = digits.replace(/^0+/, '');
  // Checked on the length first so that an arbitrarily long input never becomes a number.
  if (whole.length > MAX_WHOLE.length) {
    return reject('above_maximum');
  }
  const minor = scale(whole, fraction, decimals);
  if (minor === 0) {
    return reject('not_positive');
  }
  if (minor > scale(MAX_WHOLE, MAX_FRACTION, decimals)) {
    return reject('above_maximum');
  }
  return { ok: true, minor };
}

/**
 * Converts an integer in the currency's minor unit to a decimal string with exactly the
 * currency's decimal places ("50.00", "1.250"). Zero and sums larger than one expense are
 * valid, because totals use this too. Anything that is not a whole, non-negative, exactly
 * representable number is a programming error and throws.
 */
export function fromMinor(minor: number, currency: CurrencyCode): string {
  if (!Number.isSafeInteger(minor) || minor < 0) {
    throw new RangeError('Minor units must be a non-negative safe integer');
  }
  const { decimals } = getCurrency(currency);
  const digits = String(minor).padStart(decimals + 1, '0');
  return `${digits.slice(0, -decimals)}.${digits.slice(-decimals)}`;
}
