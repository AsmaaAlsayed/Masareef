import { describe, expect, it } from 'vitest';

import {
  CURRENCIES,
  CURRENCY_CODES,
  DEFAULT_CURRENCY,
  getCurrency,
  isCurrencyCode,
} from './index.js';

describe('currencies (FR-015)', () => {
  it('currencies_are_exactly_seven', () => {
    // FR-015 criterion 3: exactly these, in this order.
    expect(CURRENCY_CODES).toEqual(['EGP', 'USD', 'EUR', 'SAR', 'AED', 'GBP', 'KWD']);
    expect(CURRENCIES.map((currency) => currency.code)).toEqual(CURRENCY_CODES);
  });

  it('kwd_has_three_decimal_places_and_every_other_currency_two', () => {
    // FR-015 criterion 4 and note.
    for (const currency of CURRENCIES) {
      expect(currency.decimals).toBe(currency.code === 'KWD' ? 3 : 2);
    }
  });

  it('egp_symbol_is_the_code_in_english_and_ج.م_in_arabic', () => {
    // FR-022 criterion 2, RA-19.
    expect(getCurrency('EGP').symbol).toEqual({ en: 'EGP', ar: 'ج.م' });
  });

  it('every_currency_has_a_display_symbol_in_both_languages_with_the_code_in_english', () => {
    for (const currency of CURRENCIES) {
      expect(currency.symbol.en).toBe(currency.code);
      expect(currency.symbol.ar.trim()).not.toBe('');
      expect(currency.symbol.ar).not.toMatch(/[\u0660-\u0669\u06F0-\u06F9]/);
    }
  });

  it('default_currency_is_EGP', () => {
    expect(DEFAULT_CURRENCY).toBe('EGP');
  });

  it('get_currency_returns_the_definition_for_each_code', () => {
    for (const currency of CURRENCIES) {
      expect(getCurrency(currency.code)).toBe(currency);
    }
  });

  it('get_currency_throws_for_a_code_outside_the_list', () => {
    // Reachable only when unvalidated input is cast past the type; callers check isCurrencyCode.
    expect(() => getCurrency('JPY' as never)).toThrow(RangeError);
  });

  it('currency_list_cannot_be_changed_at_runtime', () => {
    expect(Object.isFrozen(CURRENCIES)).toBe(true);
    expect(Object.isFrozen(CURRENCIES[0])).toBe(true);
    expect(Object.isFrozen(CURRENCIES[0]?.symbol)).toBe(true);
    expect(Object.isFrozen(CURRENCY_CODES)).toBe(true);
  });

  it('is_currency_code_accepts_only_the_seven_codes', () => {
    for (const code of CURRENCY_CODES) {
      expect(isCurrencyCode(code)).toBe(true);
    }
    for (const value of ['', 'egp', 'JPY', 'EGP ', 'constructor', 5, null, undefined, {}]) {
      expect(isCurrencyCode(value)).toBe(false);
    }
  });
});
