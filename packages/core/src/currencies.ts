import type { Localized } from './language.js';

const currency = <Code extends string, Decimals extends 2 | 3>(
  code: Code,
  decimals: Decimals,
  arabicSymbol: string,
) =>
  Object.freeze({
    code,
    decimals,
    symbol: Object.freeze({ en: code, ar: arabicSymbol }) satisfies Localized,
  });

/**
 * The supported currencies, in the order the selector shows them (FR-015 criterion 3).
 * `decimals` is the ISO 4217 minor unit: three for KWD, two for the others (FR-015 criterion 4).
 * `symbol` is what is shown next to an amount: the code in English; in Arabic, ج.م for EGP
 * (FR-022 criterion 2). The requirements name no Arabic symbol for the other six, so they
 * show their code until one is specified.
 */
export const CURRENCIES = Object.freeze([
  currency('EGP', 2, 'ج.م'),
  currency('USD', 2, 'USD'),
  currency('EUR', 2, 'EUR'),
  currency('SAR', 2, 'SAR'),
  currency('AED', 2, 'AED'),
  currency('GBP', 2, 'GBP'),
  currency('KWD', 3, 'KWD'),
] as const);

export type Currency = (typeof CURRENCIES)[number];
export type CurrencyCode = Currency['code'];

export const CURRENCY_CODES: readonly CurrencyCode[] = Object.freeze(
  CURRENCIES.map((entry) => entry.code),
);

/** The currency of a new account (FR-015 criterion 1). */
export const DEFAULT_CURRENCY: CurrencyCode = 'EGP';

const BY_CODE = new Map<CurrencyCode, Currency>(CURRENCIES.map((entry) => [entry.code, entry]));

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && (CURRENCY_CODES as readonly string[]).includes(value);
}

export function getCurrency(code: CurrencyCode): Currency {
  const found = BY_CODE.get(code);
  if (found === undefined) {
    throw new RangeError('Unknown currency code');
  }
  return found;
}
