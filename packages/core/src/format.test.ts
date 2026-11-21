import { describe, expect, it } from 'vitest';

import {
  AMOUNT_LABEL_SEPARATOR,
  CURRENCY_CODES,
  formatAmount,
  formatAmountParts,
  formatDate,
  LANGUAGES,
} from './index.js';
import type { CurrencyCode, Language } from './index.js';

/** Arabic-Indic (U+0660 to U+0669) and Extended Arabic-Indic (U+06F0 to U+06F9) digits. */
const NON_WESTERN_DIGIT = /[٠-٩۰-۹]/;
const SEP = AMOUNT_LABEL_SEPARATOR;

describe('FR-022 criterion 2: amounts', () => {
  it('1234.5_EGP_formats_as_1,234.50_in_both_languages', () => {
    // 1,234.50 EGP is 123,450 piastres.
    expect(formatAmountParts(123450, 'EGP', 'en')).toEqual({ number: '1,234.50', label: 'EGP' });
    expect(formatAmountParts(123450, 'EGP', 'ar')).toEqual({ number: '1,234.50', label: 'ج.م' });
    expect(formatAmount(123450, 'EGP', 'en')).toBe(`1,234.50${SEP}EGP`);
    expect(formatAmount(123450, 'EGP', 'ar')).toBe(`1,234.50${SEP}ج.م`);
  });

  it('EGP_symbol_is_ج.م_in_arabic_and_EGP_in_english', () => {
    expect(formatAmountParts(100, 'EGP', 'ar').label).toBe('ج.م');
    expect(formatAmountParts(100, 'EGP', 'en').label).toBe('EGP');
  });

  it('the_other_six_currencies_show_their_code_in_both_languages', () => {
    // T-002 and PQ-06: no Arabic symbol is specified for them.
    for (const code of CURRENCY_CODES.filter((entry) => entry !== 'EGP')) {
      for (const language of LANGUAGES) {
        expect(formatAmountParts(100, code, language).label).toBe(code);
      }
    }
  });

  it('the_separator_is_one_no_break_space_so_number_and_label_never_wrap_apart', () => {
    expect(SEP).toBe(' ');
  });

  it('the_number_part_holds_only_digits_comma_and_point_so_it_cannot_be_reordered', () => {
    // Inside right-to-left text a run of European digits joined by "," and "." is laid out left
    // to right as one number (Unicode bidirectional algorithm, rules W4 and W5); the web helper
    // also isolates it in <bdi dir="ltr"> (FR-022 criterion 2).
    for (const code of CURRENCY_CODES) {
      for (const minor of [0, 1, 999, 123450, 999999999, Number.MAX_SAFE_INTEGER]) {
        expect(formatAmountParts(minor, code, 'ar').number).toMatch(
          /^[0-9]{1,3}(,[0-9]{3})*\.[0-9]+$/,
        );
      }
    }
  });
});

describe('FR-015 note: display decimals', () => {
  it('KWD_shows_three_decimals', () => {
    expect(formatAmountParts(1250, 'KWD', 'en').number).toBe('1.250');
    expect(formatAmountParts(1250, 'KWD', 'ar').number).toBe('1.250');
    expect(formatAmount(1234567, 'KWD', 'en')).toBe(`1,234.567${SEP}KWD`);
  });

  it('every_currency_other_than_KWD_shows_two_decimals', () => {
    for (const code of CURRENCY_CODES.filter((entry) => entry !== 'KWD')) {
      expect(formatAmountParts(5000, code, 'en').number).toBe('50.00');
    }
  });

  it('zero_is_shown_with_the_currency_decimals', () => {
    expect(formatAmount(0, 'USD', 'en')).toBe(`0.00${SEP}USD`);
    expect(formatAmount(0, 'USD', 'ar')).toBe(`0.00${SEP}USD`);
    expect(formatAmountParts(0, 'KWD', 'en').number).toBe('0.000');
  });

  it('amounts_below_one_keep_a_leading_zero', () => {
    expect(formatAmountParts(5, 'EGP', 'en').number).toBe('0.05');
    expect(formatAmountParts(5, 'KWD', 'en').number).toBe('0.005');
  });
});

describe('grouping', () => {
  it('groups_the_whole_part_in_threes_at_each_boundary', () => {
    const cases: readonly (readonly [number, string])[] = [
      [99999, '999.99'],
      [100000, '1,000.00'],
      [99999999, '999,999.99'],
      [100000000, '1,000,000.00'],
      // The largest single expense (MAX_AMOUNT).
      [999999999, '9,999,999.99'],
    ];
    for (const [minor, number] of cases) {
      expect(formatAmountParts(minor, 'EGP', 'en').number).toBe(number);
    }
  });

  it('totals_above_one_expense_maximum_are_formatted', () => {
    // FR-016: a monthly total can exceed the 9,999,999.99 limit of one expense.
    expect(formatAmount(123456789012, 'EGP', 'ar')).toBe(`1,234,567,890.12${SEP}ج.م`);
    expect(formatAmountParts(Number.MAX_SAFE_INTEGER, 'EGP', 'en').number).toBe(
      '90,071,992,547,409.91',
    );
    expect(formatAmountParts(Number.MAX_SAFE_INTEGER, 'KWD', 'en').number).toBe(
      '9,007,199,254,740.991',
    );
  });
});

describe('invalid amounts are programming errors and throw, as fromMinor does', () => {
  it('rejects_negative_fractional_unsafe_and_non_finite_minor_units', () => {
    for (const minor of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1, Number.NaN, Infinity]) {
      expect(() => formatAmount(minor, 'EGP', 'en'), String(minor)).toThrow(RangeError);
      expect(() => formatAmountParts(minor, 'EGP', 'ar'), String(minor)).toThrow(RangeError);
    }
  });

  it('rejects_an_unknown_currency_or_language', () => {
    expect(() => formatAmount(100, 'JPY' as CurrencyCode, 'en')).toThrow(RangeError);
    expect(() => formatAmount(100, 'EGP', 'fr' as Language)).toThrow(RangeError);
  });
});

describe('FR-022 criterion 3: dates', () => {
  const months: readonly (readonly [string, string, string])[] = [
    ['01', 'Jan', 'يناير'],
    ['02', 'Feb', 'فبراير'],
    ['03', 'Mar', 'مارس'],
    ['04', 'Apr', 'أبريل'],
    ['05', 'May', 'مايو'],
    ['06', 'Jun', 'يونيو'],
    ['07', 'Jul', 'يوليو'],
    ['08', 'Aug', 'أغسطس'],
    ['09', 'Sep', 'سبتمبر'],
    ['10', 'Oct', 'أكتوبر'],
    ['11', 'Nov', 'نوفمبر'],
    ['12', 'Dec', 'ديسمبر'],
  ];

  it('date_formats_en_and_ar_for_every_month', () => {
    expect(formatDate('2026-11-16', 'en')).toBe('16 Nov 2026');
    expect(formatDate('2026-11-16', 'ar')).toBe('16 نوفمبر 2026');
    for (const [month, english, arabic] of months) {
      expect(formatDate(`2026-${month}-16`, 'en')).toBe(`16 ${english} 2026`);
      expect(formatDate(`2026-${month}-16`, 'ar')).toBe(`16 ${arabic} 2026`);
    }
  });

  it('single_digit_days_have_no_leading_zero', () => {
    expect(formatDate('2026-01-05', 'en')).toBe('5 Jan 2026');
    expect(formatDate('2026-01-05', 'ar')).toBe('5 يناير 2026');
    expect(formatDate('2026-03-01', 'en')).toBe('1 Mar 2026');
    expect(formatDate('2026-12-31', 'en')).toBe('31 Dec 2026');
  });

  it('accepts_29_february_only_in_a_leap_year', () => {
    expect(formatDate('2028-02-29', 'en')).toBe('29 Feb 2028');
    expect(formatDate('2000-02-29', 'ar')).toBe('29 فبراير 2000');
    expect(() => formatDate('2026-02-29', 'en')).toThrow(RangeError);
    expect(() => formatDate('1900-02-29', 'en')).toThrow(RangeError);
  });

  it('rejects_anything_but_a_calendar_date_written_YYYY-MM-DD', () => {
    const invalid = [
      '',
      '2026-11-1',
      '2026-1-16',
      '16/11/2026',
      '2026-11-16T00:00:00Z',
      ' 2026-11-16',
      '2026-00-10',
      '2026-13-10',
      '2026-04-31',
      '2026-11-00',
      '٢٠٢٦-١١-١٦',
    ];
    for (const date of invalid) {
      expect(() => formatDate(date, 'en'), date).toThrow(RangeError);
    }
    expect(() => formatDate('2026-11-16', 'fr' as Language)).toThrow(RangeError);
  });
});

describe('FR-022 criterion 1: Western digits only', () => {
  it('arabic_output_contains_no_arabic_indic_digit', () => {
    const outputs: string[] = [];
    const amounts = [0, 1, 7, 10, 99, 100, 123450, 9876543210, 999999999, Number.MAX_SAFE_INTEGER];
    for (const language of LANGUAGES) {
      for (const code of CURRENCY_CODES) {
        for (const minor of amounts) {
          const parts = formatAmountParts(minor, code, language);
          outputs.push(formatAmount(minor, code, language), parts.number, parts.label);
        }
      }
      for (let month = 1; month <= 12; month += 1) {
        for (const day of ['01', '09', '10', '28']) {
          outputs.push(formatDate(`2026-${String(month).padStart(2, '0')}-${day}`, language));
        }
      }
    }
    expect(outputs.length).toBe(2 * (7 * 10 * 3 + 12 * 4));
    expect(outputs.filter((text) => NON_WESTERN_DIGIT.test(text))).toEqual([]);
    // And the Arabic outputs really are Arabic, so the check above is not vacuous.
    expect(formatDate('2026-11-16', 'ar')).toMatch(/[؀-ۿ]/);
  });
});
