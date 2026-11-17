import { describe, expect, it } from 'vitest';

import { CURRENCY_CODES, fromMinor, MAX_AMOUNT, toMinor } from './index.js';

const ok = (minor: number) => ({ ok: true, minor });
const rejected = (reason: string) => ({ ok: false, reason });

describe('toMinor', () => {
  it('to_minor_EGP_50_is_5000', () => {
    expect(toMinor('50', 'EGP')).toEqual(ok(5000));
  });

  it('to_minor_KWD_1.250_is_1250', () => {
    // FR-015 criterion 4.
    expect(toMinor('1.250', 'KWD')).toEqual(ok(1250));
  });

  it('to_minor_rejects_10.555_EGP', () => {
    // FR-010 criterion 4, FR-015 criterion 4.
    expect(toMinor('10.555', 'EGP')).toEqual(rejected('too_many_decimals'));
  });

  it('to_minor_rejects_three_decimals_for_every_currency_except_KWD', () => {
    for (const code of CURRENCY_CODES) {
      const result = toMinor('1.250', code);
      expect(result).toEqual(code === 'KWD' ? ok(1250) : rejected('too_many_decimals'));
    }
    expect(toMinor('1.2505', 'KWD')).toEqual(rejected('too_many_decimals'));
    // Trailing zeros are still more decimal places than the currency allows.
    expect(toMinor('10.500', 'EGP')).toEqual(rejected('too_many_decimals'));
  });

  it('to_minor_rejects_zero_negative_and_non_numeric', () => {
    // FR-010 criterion 3.
    for (const zero of ['0', '0.00', '000', '0.0']) {
      expect(toMinor(zero, 'EGP')).toEqual(rejected('not_positive'));
    }
    expect(toMinor('0.000', 'KWD')).toEqual(rejected('not_positive'));
    for (const negative of ['-5', '-0.01', '-0', '-9999999.99']) {
      expect(toMinor(negative, 'EGP')).toEqual(rejected('not_positive'));
    }
    const notNumbers = [
      'abc',
      '12abc',
      '1e3',
      '1,234.50',
      '1 234',
      ' 50',
      '50 ',
      '+50',
      '--5',
      '5-',
      '.',
      '.5',
      '5.',
      '1.2.3',
      '0x10',
      'NaN',
      'Infinity',
      '50\n',
      '٥٠',
      '50٫5',
      '-',
      '-abc',
    ];
    for (const text of notNumbers) {
      expect(toMinor(text, 'EGP'), JSON.stringify(text)).toEqual(rejected('not_a_number'));
    }
  });

  it('to_minor_rejects_the_empty_string', () => {
    // FR-010 criterion 3: "empty".
    expect(toMinor('', 'EGP')).toEqual(rejected('empty'));
  });

  it('to_minor_rejects_above_9999999.99', () => {
    // FR-010 criterion 3, RA-10.
    expect(toMinor('10000000', 'EGP')).toEqual(rejected('above_maximum'));
    expect(toMinor('10000000.00', 'EGP')).toEqual(rejected('above_maximum'));
    expect(toMinor('9999999.991', 'KWD')).toEqual(rejected('above_maximum'));
    expect(toMinor('9999999.999', 'KWD')).toEqual(rejected('above_maximum'));
    expect(toMinor('10000000.000', 'KWD')).toEqual(rejected('above_maximum'));
    expect(toMinor('9'.repeat(400), 'EGP')).toEqual(rejected('above_maximum'));
    expect(toMinor('99999999999999999999.99', 'EGP')).toEqual(rejected('above_maximum'));
  });

  it('to_minor_accepts_the_maximum_9999999.99_exactly', () => {
    expect(MAX_AMOUNT).toBe('9999999.99');
    expect(toMinor('9999999.99', 'EGP')).toEqual(ok(999999999));
    expect(toMinor('9999999.99', 'KWD')).toEqual(ok(9999999990));
    expect(toMinor('9999999.990', 'KWD')).toEqual(ok(9999999990));
  });

  it('to_minor_accepts_the_smallest_amount_of_each_currency', () => {
    expect(toMinor('0.01', 'EGP')).toEqual(ok(1));
    expect(toMinor('0.001', 'KWD')).toEqual(ok(1));
  });

  it('to_minor_accepts_fewer_decimals_than_the_currency_allows', () => {
    expect(toMinor('50.5', 'EGP')).toEqual(ok(5050));
    expect(toMinor('0.5', 'EGP')).toEqual(ok(50));
    expect(toMinor('1.2', 'KWD')).toEqual(ok(1200));
    expect(toMinor('1.25', 'KWD')).toEqual(ok(1250));
    expect(toMinor('1', 'KWD')).toEqual(ok(1000));
  });

  it('to_minor_ignores_leading_zeros_of_the_whole_part', () => {
    expect(toMinor('050', 'EGP')).toEqual(ok(5000));
    expect(toMinor('00000000000001.50', 'EGP')).toEqual(ok(150));
  });

  it('to_minor_is_exact_where_binary_floating_point_is_not', () => {
    // 1.15 * 100, 4.35 * 100 and 0.07 * 100 are not integers in floating point.
    expect(toMinor('1.15', 'USD')).toEqual(ok(115));
    expect(toMinor('4.35', 'EUR')).toEqual(ok(435));
    expect(toMinor('0.07', 'GBP')).toEqual(ok(7));
    expect(toMinor('1234.50', 'EGP')).toEqual(ok(123450));
    expect(toMinor('8.165', 'KWD')).toEqual(ok(8165));
  });
});

describe('fromMinor', () => {
  it('from_minor_round_trips', () => {
    const cases: [string, (typeof CURRENCY_CODES)[number]][] = [
      ['50.00', 'EGP'],
      ['0.01', 'EGP'],
      ['0.50', 'EGP'],
      ['1234.50', 'EGP'],
      ['1.15', 'USD'],
      ['4.35', 'EUR'],
      ['19.99', 'SAR'],
      ['100.00', 'AED'],
      ['0.07', 'GBP'],
      ['9999999.99', 'EGP'],
      ['1.250', 'KWD'],
      ['0.001', 'KWD'],
      ['9999999.990', 'KWD'],
    ];
    for (const [text, code] of cases) {
      const result = toMinor(text, code);
      if (!result.ok) {
        throw new Error(`expected ${text} ${code} to convert, got ${result.reason}`);
      }
      expect(fromMinor(result.minor, code)).toBe(text);
      expect(toMinor(fromMinor(result.minor, code), code)).toEqual(result);
    }
  });

  it('from_minor_pads_to_the_decimal_places_of_the_currency', () => {
    expect(fromMinor(5000, 'EGP')).toBe('50.00');
    expect(fromMinor(5, 'EGP')).toBe('0.05');
    expect(fromMinor(1250, 'KWD')).toBe('1.250');
    expect(fromMinor(5, 'KWD')).toBe('0.005');
    expect(fromMinor(0, 'EGP')).toBe('0.00');
    expect(fromMinor(0, 'KWD')).toBe('0.000');
  });

  it('from_minor_converts_totals_larger_than_one_expense_exactly', () => {
    expect(fromMinor(123456789012345, 'EGP')).toBe('1234567890123.45');
    expect(fromMinor(Number.MAX_SAFE_INTEGER, 'KWD')).toBe('9007199254740.991');
  });

  it('from_minor_throws_on_values_that_are_not_whole_non_negative_minor_units', () => {
    const invalid = [0.5, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1];
    for (const value of invalid) {
      expect(() => fromMinor(value, 'EGP')).toThrow(RangeError);
    }
  });
});
