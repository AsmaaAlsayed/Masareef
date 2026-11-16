import { describe, expect, it } from 'vitest';

import { toWesternDigits } from './index.js';

describe('toWesternDigits (FR-022 criterion 4)', () => {
  it('digits_٥٠_becomes_50', () => {
    expect(toWesternDigits('٥٠')).toBe('50');
  });

  it('converts_all_ten_arabic_indic_digits', () => {
    expect(toWesternDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
  });

  it('converts_all_ten_eastern_arabic_digits', () => {
    expect(toWesternDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
  });

  it('converts_digits_inside_a_decimal_amount_and_keeps_the_separator', () => {
    expect(toWesternDigits('١٢٣٤.٥٠')).toBe('1234.50');
    expect(toWesternDigits('١.٢٥٠')).toBe('1.250');
  });

  it('converts_mixed_scripts_in_one_string', () => {
    expect(toWesternDigits('1٢۳')).toBe('123');
  });

  it('leaves_western_digits_letters_and_punctuation_unchanged', () => {
    expect(toWesternDigits('50')).toBe('50');
    expect(toWesternDigits('دفعت ٥٠ جنيه, paid -٣')).toBe('دفعت 50 جنيه, paid -3');
  });

  it('leaves_the_characters_next_to_the_digit_ranges_unchanged', () => {
    const neighbours = '\u065F\u066A\u066B\u066C\u06EF\u06FA';
    expect(toWesternDigits(neighbours)).toBe(neighbours);
  });

  it('returns_the_empty_string_for_the_empty_string', () => {
    expect(toWesternDigits('')).toBe('');
  });
});
