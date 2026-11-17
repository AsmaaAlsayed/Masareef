import { describe, expect, it } from 'vitest';

import {
  CURRENCY_VOCABULARY,
  findAmounts,
  findCurrencies,
  normalize,
  parseAmount,
  parseMoney,
  resolveMoney,
  toMinor,
  type CurrencyCode,
} from '../index.js';

/**
 * The user's default currency in these tests is deliberately not EGP, so that a test can tell
 * "EGP because the user said pounds" apart from "EGP because it is the default".
 */
const DEFAULT: CurrencyCode = 'SAR';

const money = (text: string, defaultCurrency: CurrencyCode = DEFAULT) =>
  parseMoney(text, defaultCurrency);

const clean = (amount: string, currency: CurrencyCode) => ({
  amount,
  currency,
  attention: { amount: false, currency: false },
});

describe('FR-028 criterion 1: no currency word gives the default currency', () => {
  it('no_currency_word_uses_default', () => {
    expect(money('صرفت خمسين على الغدا')).toEqual(clean('50', 'SAR'));
    expect(money('spent fifty on lunch')).toEqual(clean('50', 'SAR'));
    expect(money('صرفت خمسين على الغدا', 'KWD')).toEqual(clean('50', 'KWD'));
    expect(money('lunch 20', 'EGP')).toEqual(clean('20', 'EGP'));
  });
});

describe('FR-028 criterion 2: pounds and piastres are EGP; sterling is GBP', () => {
  it('pounds_unqualified_is_EGP', () => {
    for (const text of [
      'صرفت خمسين جنيه على الغدا',
      'spent 50 pounds on lunch',
      'fifty pound',
      '٥٠ جنيهات',
      'بخمسين جنيه',
    ]) {
      expect(money(text), text).toEqual(clean('50', 'EGP'));
    }
    expect(money('جنيهين')).toEqual(clean('2', 'EGP'));
  });

  it('pounds_is_EGP_whatever_the_default', () => {
    for (const defaultCurrency of ['USD', 'GBP', 'KWD'] as const) {
      expect(money('50 pounds', defaultCurrency)).toEqual(clean('50', 'EGP'));
    }
  });

  it('piastres_unqualified_are_EGP', () => {
    expect(money('خمسين قرش')).toEqual(clean('0.5', 'EGP'));
    expect(money('قرشين', 'USD')).toEqual(clean('0.02', 'EGP'));
  });

  it('pounds_sterling_is_GBP', () => {
    for (const text of [
      'خمسين جنيه استرليني',
      'خمسين جنيه إسترليني',
      'خمسين جنيه استرلينى',
      'خمسين الجنيه الاسترليني',
      '50 pounds sterling',
      'fifty pound sterling',
      '50 british pounds',
      'خمسين جنيه انجليزي',
    ]) {
      expect(money(text), text).toEqual(clean('50', 'GBP'));
    }
  });

  it('egyptian_pound_qualifier_is_EGP', () => {
    expect(money('خمسين جنيه مصري')).toEqual(clean('50', 'EGP'));
    expect(money('50 egyptian pounds')).toEqual(clean('50', 'EGP'));
  });
});

describe('FR-028 criterion 3: the five other listed currencies', () => {
  const pairs: [string, string, CurrencyCode][] = [
    ['عشرين دولار', '20 dollars', 'USD'],
    ['عشرين يورو', '20 euros', 'EUR'],
    ['عشرين ريال', '20 riyals', 'SAR'],
    ['عشرين درهم', '20 dirhams', 'AED'],
    ['عشرين دينار', '20 dinars', 'KWD'],
  ];
  for (const [arabic, english, code] of pairs) {
    it(`${arabic}_and_${english}_are_${code}`, () => {
      // The default is EGP here, so SAR comes from the word "ريال", not from the default.
      expect(money(arabic, 'EGP')).toEqual(clean('20', code));
      expect(money(english, 'EGP')).toEqual(clean('20', code));
    });
  }

  it('spelling_plural_and_singular_variants', () => {
    const variants: [string, CurrencyCode][] = [
      ['20 دولارات', 'USD'],
      ['twenty dollar', 'USD'],
      ['عشرين دولار امريكي', 'USD'],
      ['20 us dollars', 'USD'],
      ['20 euro', 'EUR'],
      ['عشرين يورو', 'EUR'],
      ['20 ريالات', 'SAR'],
      ['20 riyal', 'SAR'],
      ['20 rials', 'SAR'],
      ['عشرين ريال سعودي', 'SAR'],
      ['20 saudi riyals', 'SAR'],
      ['20 دراهم', 'AED'],
      ['20 dirham', 'AED'],
      ['عشرين درهم اماراتي', 'AED'],
      ['20 uae dirhams', 'AED'],
      ['20 دنانير', 'KWD'],
      ['20 dinar', 'KWD'],
      ['عشرين دينار كويتي', 'KWD'],
      ['20 kuwaiti dinars', 'KWD'],
      ['20 usd', 'USD'],
      ['20 EGP', 'EGP'],
    ];
    for (const [text, code] of variants) {
      expect(money(text, 'EGP'), text).toEqual(clean('20', code));
    }
  });

  it('dual_words_are_an_amount_of_two', () => {
    expect(money('دولارين', 'EGP')).toEqual(clean('2', 'USD'));
    expect(money('ريالين', 'EGP')).toEqual(clean('2', 'SAR'));
    expect(money('درهمين', 'EGP')).toEqual(clean('2', 'AED'));
    expect(money('دينارين', 'EGP')).toEqual(clean('2', 'KWD'));
  });

  it('halves_and_quarters_of_other_currencies', () => {
    expect(money('خمسة دولار ونص', 'EGP')).toEqual(clean('5.5', 'USD'));
    expect(money('five and a half euros', 'EGP')).toEqual(clean('5.5', 'EUR'));
    expect(money('نص دينار', 'EGP')).toEqual(clean('0.5', 'KWD'));
    expect(money('دولار وربع', 'EGP')).toEqual(clean('1.25', 'USD'));
  });

  it('attached_particles_and_article_are_split_from_currency_words', () => {
    expect(money('تاكسي بعشرين دولار', 'EGP')).toEqual(clean('20', 'USD'));
    expect(money('دفعت عشرين بالدولار', 'EGP')).toMatchObject({ amount: '20', currency: 'USD' });
  });

  it('kwd_amount_keeps_three_decimals_unrounded', () => {
    const parsed = money('1.255 dinars', 'EGP');
    expect(parsed).toEqual(clean('1.255', 'KWD'));
    expect(toMinor(parsed.amount ?? '', parsed.currency)).toEqual({ ok: true, minor: 1255 });
    // Validation is the form's job (FR-025 criterion 8): the parser returns it as said.
    const tooPrecise = money('1.2555 dinars', 'EGP');
    expect(tooPrecise.amount).toBe('1.2555');
    expect(toMinor(tooPrecise.amount ?? '', tooPrecise.currency)).toEqual({
      ok: false,
      reason: 'too_many_decimals',
    });
  });

  it('piastres_after_another_currency_are_not_joined_to_it', () => {
    // Piastres are hundredths of the Egyptian pound only.
    const parsed = money('عشرين دولار وخمسين قرش', 'EGP');
    expect(parsed.amount).toBe('20');
    expect(parsed.currency).toBe('USD');
    expect(parsed.attention.amount).toBe(true);
  });
});

describe('FR-028 criterion 4: a currency outside the list', () => {
  it('yen_uses_default_and_flags', () => {
    expect(money('20 yen')).toEqual({
      amount: '20',
      currency: 'SAR',
      attention: { amount: false, currency: true },
    });
    expect(money('٢٠ ين ياباني', 'EGP')).toEqual({
      amount: '20',
      currency: 'EGP',
      attention: { amount: false, currency: true },
    });
  });

  it('other_unlisted_currencies_use_default_and_flag', () => {
    for (const text of [
      '20 yuan',
      '20 rupees',
      'عشرين روبية',
      '20 lira',
      'عشرين ليرة',
      '20 francs',
      '20 rubles',
      '20 pesos',
      'عشرين ريال قطري',
      '20 qatari riyals',
      'عشرين ريال عماني',
      'عشرين دينار اردني',
      '20 jordanian dinars',
      'عشرين دينار بحريني',
      'عشرين درهم مغربي',
      '20 moroccan dirhams',
      'عشرين دولار كندي',
      '20 canadian dollars',
      '20 australian dollars',
      'عشرين جنيه سوداني',
      '20 lebanese pounds',
    ]) {
      expect(money(text, 'USD'), text).toEqual({
        amount: '20',
        currency: 'USD',
        attention: { amount: false, currency: true },
      });
    }
  });
});

describe('FR-025 criterion 3: piastres give EGP', () => {
  it('piastres_only_is_EGP_0.75', () => {
    expect(money('خمسة وسبعين قرش')).toEqual(clean('0.75', 'EGP'));
    expect(money('75 piastres')).toEqual(clean('0.75', 'EGP'));
    expect(money('75 piastres', 'KWD')).toEqual(clean('0.75', 'EGP'));
  });

  it('pounds_and_piastres_is_EGP_2.50', () => {
    const parsed = money('اتنين جنيه وخمسين قرش', 'USD');
    expect(parsed).toEqual(clean('2.5', 'EGP'));
    expect(toMinor(parsed.amount ?? '', parsed.currency)).toEqual({ ok: true, minor: 250 });
  });
});

describe('FR-025 criterion 7: two unrelated amounts', () => {
  it('two_amounts_uses_first_and_flags', () => {
    expect(money('50 pounds lunch and 20 taxi')).toEqual({
      amount: '50',
      currency: 'EGP',
      attention: { amount: true, currency: false },
    });
    expect(money('خمسين جنيه غدا وعشرين تاكسي')).toEqual({
      amount: '50',
      currency: 'EGP',
      attention: { amount: true, currency: false },
    });
    expect(money('lunch 50 and taxi 20')).toEqual({
      amount: '50',
      currency: 'SAR',
      attention: { amount: true, currency: false },
    });
  });

  it('two_amounts_in_different_currencies_use_the_first_and_its_own_currency', () => {
    expect(money('20 dollars lunch and 50 pounds taxi', 'EGP')).toEqual({
      amount: '20',
      currency: 'USD',
      attention: { amount: true, currency: false },
    });
    expect(money('عشرين يورو و٥٠ جنيه', 'EGP')).toEqual({
      amount: '20',
      currency: 'EUR',
      attention: { amount: true, currency: false },
    });
  });

  it('the_number_next_to_a_currency_word_wins_over_an_earlier_bare_number (ADR 0003 step 4)', () => {
    expect(money('تلاتة سندوتشات بخمسين جنيه')).toEqual({
      amount: '50',
      currency: 'EGP',
      attention: { amount: true, currency: false },
    });
    expect(money('3 coffees for 12 dollars', 'EGP')).toEqual({
      amount: '12',
      currency: 'USD',
      attention: { amount: true, currency: false },
    });
  });

  it('a_number_inside_a_date_expression_is_not_a_second_amount', () => {
    expect(money('صرفت خمسين جنيه من تلات أيام')).toEqual(clean('50', 'EGP'));
    expect(money('20 dollars three days ago', 'EGP')).toEqual(clean('20', 'USD'));
  });
});

describe('currency words with no adjacent number', () => {
  it('a_lone_currency_word_names_the_currency_but_is_flagged', () => {
    // FR-028 criterion 2 names the bare word; with no amount it attaches to, it is a guess.
    expect(money('جنيه')).toEqual({
      currency: 'EGP',
      attention: { amount: true, currency: true },
    });
    expect(money('قرش')).toEqual({
      currency: 'EGP',
      attention: { amount: true, currency: true },
    });
    expect(money('lunch in dollars', 'EGP')).toEqual({
      currency: 'USD',
      attention: { amount: true, currency: true },
    });
  });

  it('a_currency_word_apart_from_the_amount_is_used_but_flagged', () => {
    expect(money('dollars, I paid twenty for lunch', 'EGP')).toEqual({
      amount: '20',
      currency: 'USD',
      attention: { amount: false, currency: true },
    });
  });

  it('unattached_words_for_different_currencies_give_the_default_flagged', () => {
    expect(money('paid twenty in dollars or euros', 'EGP')).toEqual({
      amount: '20',
      currency: 'EGP',
      attention: { amount: false, currency: true },
    });
    expect(money('paid twenty in yen', 'EGP')).toEqual({
      amount: '20',
      currency: 'EGP',
      attention: { amount: false, currency: true },
    });
  });

  it('a_word_bound_to_an_amount_wins_over_a_word_elsewhere', () => {
    expect(money('in dollars? no, 50 pounds', 'USD')).toEqual(clean('50', 'EGP'));
  });
});

describe('empty and invalid input', () => {
  it('nothing_extractable_gives_no_amount_and_the_default_flagged_only_for_amount', () => {
    for (const text of ['', '   ', 'اشتريت غدا', 'bought lunch', '؟!']) {
      expect(money(text), JSON.stringify(text)).toEqual({
        currency: 'SAR',
        attention: { amount: true, currency: false },
      });
    }
  });

  it('rejects_a_default_currency_outside_the_list', () => {
    expect(() => parseMoney('50', 'JPY' as CurrencyCode)).toThrow(RangeError);
    expect(() => resolveMoney([], [], '' as CurrencyCode)).toThrow(RangeError);
  });

  it('words_that_merely_contain_a_currency_word_are_not_currency_words', () => {
    // "بين" (between) and "فين" (where) must not be read as particle + "ين" (yen).
    expect(money('بين خمسين وستين', 'EGP')).toMatchObject({ currency: 'EGP' });
    expect(money('فين الخمسين', 'EGP').attention.currency).toBe(false);
    expect(normalize('بين', CURRENCY_VOCABULARY)).toEqual(['بين']);
  });
});

describe('findCurrencies', () => {
  it('returns_every_currency_mention_in_order_with_token_positions', () => {
    const tokens = normalize('20 dollars and 50 pounds sterling and 3 yen', CURRENCY_VOCABULARY);
    expect(findCurrencies(tokens)).toEqual([
      { start: 1, end: 2, currency: 'USD' },
      { start: 4, end: 6, currency: 'GBP' },
      { start: 8, end: 9, currency: undefined },
    ]);
  });

  it('returns_an_empty_list_for_no_tokens', () => {
    expect(findCurrencies([])).toEqual([]);
  });
});

describe('resolveMoney', () => {
  it('works_on_matches_from_findAmounts_and_findCurrencies', () => {
    const tokens = normalize('50 lunch and 20 dinars', CURRENCY_VOCABULARY);
    expect(resolveMoney(findAmounts(tokens), findCurrencies(tokens), 'EGP')).toEqual({
      amount: '20',
      currency: 'KWD',
      attention: { amount: true, currency: false },
    });
  });

  it('two_disagreeing_words_on_one_amount_give_the_default_flagged', () => {
    const amounts = [{ amount: '2.5', start: 0, end: 4, impliedCurrency: 'EGP' as const }];
    const currencies = [
      { start: 1, end: 2, currency: 'GBP' as const },
      { start: 3, end: 4, currency: 'EGP' as const },
    ];
    expect(resolveMoney(amounts, currencies, 'USD')).toEqual({
      amount: '2.5',
      currency: 'USD',
      attention: { amount: false, currency: true },
    });
  });

  it('piastres_imply_EGP_even_without_a_currency_match', () => {
    const amounts = [{ amount: '0.75', start: 0, end: 2, impliedCurrency: 'EGP' as const }];
    expect(resolveMoney(amounts, [], 'USD')).toEqual(clean('0.75', 'EGP'));
  });
});

describe('parseAmount keeps its T-003 meaning with the new unit words', () => {
  it('reads_other_currency_units_like_pounds', () => {
    expect(parseAmount('خمسة دولار ونص')?.amount).toBe('5.5');
    expect(parseAmount('دولارين')?.amount).toBe('2');
    expect(parseAmount('دولار')).toBeUndefined();
    expect(parseAmount('dollars')).toBeUndefined();
  });
});
