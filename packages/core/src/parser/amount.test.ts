import { describe, expect, it } from 'vitest';

import { findAmounts, fromMinor, normalize, parseAmount, toMinor } from '../index.js';
import { AMOUNT_VOCABULARY } from './amount.js';

/**
 * The amount as the review screen would show it in EGP ("50.00"), computed through the T-002
 * helpers so the test also proves the parser's decimal text converts to minor units exactly.
 */
function egp(text: string): string | undefined {
  const parsed = parseAmount(text);
  if (parsed === undefined) {
    return undefined;
  }
  const minor = toMinor(parsed.amount, 'EGP');
  if (!minor.ok) {
    throw new Error(`"${parsed.amount}" from "${text}" did not convert: ${minor.reason}`);
  }
  return fromMinor(minor.minor, 'EGP');
}

describe('FR-025 criterion 1: whole amounts', () => {
  it('ar_صرفت_خمسين_جنيه_على_الغدا_is_50.00', () => {
    expect(egp('صرفت خمسين جنيه على الغدا')).toBe('50.00');
  });

  it('en_spent_50_pounds_on_lunch_is_50.00', () => {
    expect(egp('spent 50 pounds on lunch')).toBe('50.00');
  });
});

describe('FR-025 criterion 2: halves and quarters', () => {
  it('ar_خمسة_جنيه_ونص_is_5.50', () => {
    expect(egp('خمسة جنيه ونص')).toBe('5.50');
  });

  it('en_five_and_a_half_pounds_is_5.50', () => {
    expect(egp('five and a half pounds')).toBe('5.50');
  });

  it('ar_عشرة_جنيه_وربع_is_10.25', () => {
    expect(egp('عشرة جنيه وربع')).toBe('10.25');
  });

  it('en_ten_and_a_quarter_pounds_is_10.25 (counterpart written for this task)', () => {
    expect(egp('ten and a quarter pounds')).toBe('10.25');
    expect(egp('ten pounds and a quarter')).toBe('10.25');
  });

  it('half_and_quarter_variants', () => {
    expect(egp('خمسة جنيه ونصف')).toBe('5.50');
    expect(egp('خمسة ونص')).toBe('5.50');
    expect(egp('five pounds and a half')).toBe('5.50');
    expect(egp('two and a half')).toBe('2.50');
    // A pound word with no number before a fraction is one pound; a fraction alone is that part.
    expect(egp('جنيه ونص')).toBe('1.50');
    expect(egp('جنيهين وربع')).toBe('2.25');
    expect(egp('نص جنيه')).toBe('0.50');
    expect(egp('ربع جنيه')).toBe('0.25');
    expect(egp('half a pound')).toBe('0.50');
    // A fraction of something other than a pound is not an amount.
    expect(parseAmount('نص كيلو')).toBeUndefined();
    expect(parseAmount('half price')).toBeUndefined();
  });
});

describe('FR-025 criterion 3: piastres (arithmetic; currency words are T-005)', () => {
  it('ar_خمسة_وسبعين_قرش_is_0.75_EGP', () => {
    const parsed = parseAmount('خمسة وسبعين قرش');
    expect(parsed?.amount).toBe('0.75');
    expect(parsed?.impliedCurrency).toBe('EGP');
    expect(egp('خمسة وسبعين قرش')).toBe('0.75');
  });

  it('en_75_piastres_is_0.75_EGP', () => {
    const parsed = parseAmount('75 piastres');
    expect(parsed?.amount).toBe('0.75');
    expect(parsed?.impliedCurrency).toBe('EGP');
  });

  it('counterparts_seventy_five_piastres_and_٧٥_قرش_are_0.75_EGP (written for this task)', () => {
    for (const text of ['seventy five piastres', 'seventy-five piasters', '٧٥ قرش', '75 قرش']) {
      expect(parseAmount(text)?.amount, text).toBe('0.75');
      expect(parseAmount(text)?.impliedCurrency, text).toBe('EGP');
    }
  });

  it('ar_اتنين_جنيه_وخمسين_قرش_is_2.50_and_250_minor_units', () => {
    const parsed = parseAmount('اتنين جنيه وخمسين قرش');
    expect(parsed?.amount).toBe('2.5');
    expect(parsed?.impliedCurrency).toBe('EGP');
    expect(toMinor(parsed?.amount ?? '', 'EGP')).toEqual({ ok: true, minor: 250 });
  });

  it('en_two_pounds_and_fifty_piastres_is_2.50 (counterpart written for this task)', () => {
    expect(egp('two pounds and fifty piastres')).toBe('2.50');
    expect(egp('2 pounds 50 piastres')).toBe('2.50');
    expect(egp('٢ جنيه و٥٠ قرش')).toBe('2.50');
  });

  it('piastre_words_and_sums_are_exact', () => {
    expect(egp('قرشين')).toBe('0.02');
    expect(egp('خمسة قروش')).toBe('0.05');
    expect(egp('one piastre')).toBe('0.01');
    expect(egp('ميه وخمسين قرش')).toBe('1.50');
    expect(egp('جنيه وخمسين قرش')).toBe('1.50');
    expect(egp('three pounds and five piastres')).toBe('3.05');
  });

  it('amounts_without_piastres_imply_no_currency', () => {
    expect(parseAmount('خمسين جنيه')?.impliedCurrency).toBeUndefined();
    expect(parseAmount('50')?.impliedCurrency).toBeUndefined();
  });
});

describe('FR-025 criterion 4: compound numbers', () => {
  it('ar_ألف_وميتين_وخمسين_جنيه_is_1250.00', () => {
    expect(egp('ألف وميتين وخمسين جنيه')).toBe('1250.00');
  });

  it('en_one_thousand_two_hundred_and_fifty_pounds_is_1250.00', () => {
    expect(egp('one thousand two hundred and fifty pounds')).toBe('1250.00');
  });
});

describe('FR-025 criterion 5: digits in either script give the same amount as words', () => {
  const pairs: [string, string][] = [
    ['٥٠ جنيه', 'خمسين جنيه'],
    ['50 جنيه', 'خمسين جنيه'],
    ['۵۰ جنيه', 'خمسين جنيه'],
    ['50 pounds', 'fifty pounds'],
    ['٥ جنيه ونص', 'خمسة جنيه ونص'],
    ['5 and a half pounds', 'five and a half pounds'],
    ['١٠ جنيه وربع', 'عشرة جنيه وربع'],
    ['٥٫٥ جنيه', 'خمسة جنيه ونص'],
    ['5.50 pounds', 'five and a half pounds'],
    ['٧٥ قرش', 'خمسة وسبعين قرش'],
    ['٢ جنيه و٥٠ قرش', 'اتنين جنيه وخمسين قرش'],
    ['١٢٥٠ جنيه', 'ألف وميتين وخمسين جنيه'],
    ['١٬٢٥٠ جنيه', 'ألف وميتين وخمسين جنيه'],
    ['1,250 pounds', 'one thousand two hundred and fifty pounds'],
  ];
  for (const [digits, words] of pairs) {
    it(`digits_${digits}_equals_words_${words}`, () => {
      const fromWords = parseAmount(words);
      expect(fromWords).toBeDefined();
      expect(parseAmount(digits)?.amount).toBe(fromWords?.amount);
      expect(parseAmount(digits)?.impliedCurrency).toBe(fromWords?.impliedCurrency);
    });
  }
});

describe('named tests of T-003', () => {
  it('attached_prefix_بخمسين_is_50', () => {
    expect(egp('تاكسي بخمسين جنيه')).toBe('50.00');
    expect(egp('بخمسين')).toBe('50.00');
    expect(egp('ب٥٠ جنيه')).toBe('50.00');
  });

  it('spelling_variants_اتنين_and_اثنين_are_2', () => {
    for (const two of ['اتنين', 'اثنين', 'إثنين', 'اثنان']) {
      expect(egp(`${two} جنيه`), two).toBe('2.00');
    }
  });

  it('no_number_returns_none', () => {
    for (const text of ['اشتريت غدا', 'bought lunch', 'جنيه', 'pounds', 'قرش', '', '   ', '؟!']) {
      expect(parseAmount(text), JSON.stringify(text)).toBeUndefined();
    }
  });

  it('number_above_limit_is_returned_unclamped', () => {
    // FR-025 criterion 8: limits and precision are checked by the form on Save (FR-010).
    expect(parseAmount('عشرة مليون جنيه')?.amount).toBe('10000000');
    expect(parseAmount('12000000 pounds')?.amount).toBe('12000000');
    expect(parseAmount('ten million and one pounds')?.amount).toBe('10000001');
    expect(parseAmount(`${'9'.repeat(30)} جنيه`)?.amount).toBe('9'.repeat(30));
    expect(toMinor(parseAmount('عشرة مليون جنيه')?.amount ?? '', 'EGP')).toEqual({
      ok: false,
      reason: 'above_maximum',
    });
  });

  it('more_precision_than_the_currency_allows_is_returned_unrounded', () => {
    expect(parseAmount('10.555 جنيه')?.amount).toBe('10.555');
    expect(parseAmount('1.250')?.amount).toBe('1.25');
  });
});

describe('findAmounts', () => {
  it('returns_every_amount_in_order_with_token_positions', () => {
    // FR-025 criterion 7 (which amount is used and the attention flag) is decided in T-005.
    const tokens = normalize('50 pounds lunch and 20 taxi');
    const amounts = findAmounts(tokens);
    expect(amounts.map((match) => match.amount)).toEqual(['50', '20']);
    expect(amounts[0]).toMatchObject({ start: 0, end: 2 });
    expect(amounts[1]).toMatchObject({ start: 4, end: 5 });
    expect(tokens.slice(amounts[1]?.start, amounts[1]?.end)).toEqual(['20']);
  });

  it('an_amount_span_covers_its_pound_fraction_and_piastre_words', () => {
    const tokens = normalize('صرفت اتنين جنيه وخمسين قرش امبارح');
    const [match] = findAmounts(tokens);
    expect(tokens.slice(match?.start, match?.end)).toEqual(['اتنين', 'جنيه', 'و', 'خمسين', 'قرش']);
  });

  it('a_trailing_conjunction_is_not_part_of_the_amount', () => {
    const tokens = normalize('خمسين جنيه و');
    expect(findAmounts(tokens)).toEqual([{ amount: '50', start: 0, end: 2 }]);
  });

  it('returns_an_empty_list_for_no_tokens', () => {
    expect(findAmounts([])).toEqual([]);
  });
});

describe('fractions of the number or of its thousands (T-007a, PQ-07)', () => {
  it('إلا_ربع_takes_a_quarter_off', () => {
    expect(egp('عشرة إلا ربع')).toBe('9.75');
    expect(egp('عشرة الا ربع')).toBe('9.75');
    expect(egp('عشرة جنيه إلا ربع')).toBe('9.75');
    expect(egp('عشرة إلا ربع جنيه')).toBe('9.75');
    expect(egp('خمسة جنيه إلا نص')).toBe('4.50');
    expect(egp('جنيه إلا ربع')).toBe('0.75');
  });

  it('إلا_with_nothing_to_take_from_or_no_fraction_changes_nothing', () => {
    expect(parseAmount('صفر إلا ربع')?.amount).toBe('0');
    expect(parseAmount('صفر جنيه إلا ربع')?.amount).toBe('0');
    expect(egp('عشرة إلا')).toBe('10.00');
    expect(parseAmount('عشرة إلا خمسة')?.amount).toBe('10');
  });

  it('a_fraction_after_a_bare_thousand_is_a_fraction_of_the_thousand', () => {
    expect(egp('ألف ونص')).toBe('1500.00');
    expect(egp('ألف ونص جنيه')).toBe('1500.00');
    expect(egp('ألف وربع')).toBe('1250.00');
    expect(egp('ألف إلا ربع')).toBe('750.00');
    expect(egp('ألفين ونص')).toBe('2500.00');
    expect(egp('تلات تلاف ونص')).toBe('3500.00');
    expect(egp('خمستلاف ونص')).toBe('5500.00');
    expect(egp('٣ آلاف ونص')).toBe('3500.00');
    expect(parseAmount('مليون ونص')?.amount).toBe('1500000');
    expect(egp('a thousand and a half pounds')).toBe('1500.00');
  });

  it('a_fraction_before_a_scale_word_multiplies', () => {
    expect(egp('one and a half thousand pounds')).toBe('1500.00');
    expect(egp('two and a half thousand')).toBe('2500.00');
    expect(egp('two and a quarter thousand')).toBe('2250.00');
    expect(egp('خمسة ونص ألف جنيه')).toBe('5500.00');
    expect(parseAmount('اتنين ونص مليون')?.amount).toBe('2500000');
  });

  it('the_fraction_of_a_pound_is_unchanged', () => {
    expect(egp('خمسة جنيه ونص')).toBe('5.50');
    expect(egp('خمسة ونص')).toBe('5.50');
    expect(egp('ألف وخمسمية جنيه ونص')).toBe('1500.50');
    // The pound word comes between: the fraction is of a pound, as FR-025 c2 reads it.
    expect(egp('ألف جنيه ونص')).toBe('1000.50');
    expect(egp('مية ونص')).toBe('100.50');
  });
});

describe('pounds then a bare number: colloquial piastres (T-007a, PQ-07)', () => {
  it('a_number_from_1_to_99_ending_the_utterance_is_piastres', () => {
    expect(egp('خمسة جنيه وخمسين')).toBe('5.50');
    expect(egp('three pounds fifty')).toBe('3.50');
    expect(egp('12 pounds 50')).toBe('12.50');
    expect(egp('eighty five pounds fifty')).toBe('85.50');
    expect(egp('خمسة جنيه وخمسة وسبعين')).toBe('5.75');
    expect(egp('five pounds and five')).toBe('5.05');
    expect(egp('5 pounds 99')).toBe('5.99');
    expect(parseAmount('three pounds fifty')?.needsConfirmation).toBeUndefined();
  });

  it('after_a_pound_word_with_no_number_it_needs_and', () => {
    expect(egp('جنيه وخمسين')).toBe('1.50');
    expect(egp('جنيهين وخمسين')).toBe('2.50');
    expect(egp('pound and fifty')).toBe('1.50');
    // "pounds 50" names the currency first; it is fifty pounds, not 1.50.
    expect(egp('pounds 50')).toBe('50.00');
    expect(egp('جنيه 50')).toBe('50.00');
    expect(egp('pounds and 20')).toBe('20.00');
  });

  it('a_date_after_the_number_counts_as_the_end_of_the_utterance', () => {
    expect(egp('خمسة جنيه وعشرين امبارح')).toBe('5.20');
  });

  it('out_of_range_or_fractional_numbers_are_separate_amounts', () => {
    const amounts = (text: string) =>
      findAmounts(normalize(text, AMOUNT_VOCABULARY)).map(({ amount }) => amount);
    expect(amounts('5 pounds 100')).toEqual(['5', '100']);
    expect(amounts('5 pounds 0')).toEqual(['5', '0']);
    expect(amounts('5 pounds 2.5')).toEqual(['5', '2.5']);
    expect(amounts('5 pounds 50 20')).toEqual(['5', '50', '20']);
    expect(amounts('خمسين جنيه وعشرين جنيه')).toEqual(['50', '20']);
    expect(amounts('50 pounds 20 dollars')).toEqual(['50', '20']);
    // Only pounds have piastres.
    expect(amounts('five dollars fifty')).toEqual(['5', '50']);
  });

  it('with_words_after_it_only_25_50_or_75_are_piastres_and_the_amount_is_flagged', () => {
    for (const [text, amount] of [
      ['خمسة جنيه وخمسين عيش فينو', '5.5'],
      ['12 pounds 50 for a sandwich', '12.5'],
      ['three pounds seventy five for tea', '3.75'],
      ['ten pounds 25 taxi', '10.25'],
    ] as const) {
      const [match, ...rest] = findAmounts(normalize(text, AMOUNT_VOCABULARY));
      expect(match?.amount, text).toBe(amount);
      expect(match?.needsConfirmation, text).toBe(true);
      expect(rest, text).toEqual([]);
    }
  });

  it('any_other_number_with_words_after_it_suggests_a_second_expense', () => {
    for (const text of [
      'خمسين جنيه وعشرين تاكسي',
      '50 pounds 20 taxi',
      '50 pounds and 20 for taxi',
    ]) {
      expect(
        findAmounts(normalize(text, AMOUNT_VOCABULARY)).map(({ amount }) => amount),
        text,
      ).toEqual(['50', '20']);
    }
  });
});
