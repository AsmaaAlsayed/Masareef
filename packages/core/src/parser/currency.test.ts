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

describe('pounds then a bare number (T-007a, PQ-07, PQ-09)', () => {
  it('piastres_at_the_end_of_the_utterance_are_not_flagged', () => {
    expect(money('خمسة جنيه وخمسين')).toEqual(clean('5.5', 'EGP'));
    expect(money('three pounds fifty', 'USD')).toEqual(clean('3.5', 'EGP'));
  });

  it('piastres_with_words_after_them_are_flagged', () => {
    expect(money('خمسة جنيه وخمسين عيش فينو')).toEqual({
      amount: '5.5',
      currency: 'EGP',
      attention: { amount: true, currency: false },
    });
  });

  it('a_second_expense_stays_two_amounts_the_first_used_and_flagged', () => {
    for (const text of ['خمسين جنيه وعشرين تاكسي', '50 pounds 20 taxi']) {
      expect(money(text), text).toEqual({
        amount: '50',
        currency: 'EGP',
        attention: { amount: true, currency: false },
      });
    }
  });
});

const flagged = (amount: string, currency: CurrencyCode = DEFAULT) => ({
  amount,
  currency,
  attention: { amount: true, currency: false },
});

describe('a quantity is not the price (T-007a)', () => {
  it('a_number_before_a_unit_loses_to_the_remaining_number', () => {
    expect(money('paid 3 months of internet, 750')).toEqual(flagged('750'));
    expect(money('two kilos of oranges for fifty')).toEqual(flagged('50'));
    expect(money('اتنين كيلو برتقان بخمسين')).toEqual(flagged('50'));
    expect(money('3 شهور نت 750')).toEqual(flagged('750'));
    expect(money('2 pieces 90')).toEqual(flagged('90'));
    expect(money('تلات علب بستين')).toEqual(flagged('60'));
  });

  it('a_number_after_عدد_is_a_count', () => {
    expect(money('عدد 3 قهوة 90')).toEqual(flagged('90'));
  });

  it('a_counted_noun_then_a_price_after_for_at_or_ب', () => {
    expect(money('2 pizzas for 400')).toEqual(flagged('400'));
    expect(money('three coffees at 60')).toEqual(flagged('60'));
    expect(money('2 بيتزا ب 400')).toEqual(flagged('400'));
    expect(money('تلات سندوتشات بستين')).toEqual(flagged('60'));
  });

  it('two_expenses_joined_by_and_keep_the_first_amount', () => {
    expect(money('lunch 50 and taxi for 20')).toEqual(flagged('50'));
    expect(money('50 lunch and taxi for 20')).toEqual(flagged('50'));
    expect(money('خمسين غدا و تاكسي بعشرين')).toEqual(flagged('50'));
  });

  it('a_number_right_before_the_marker_is_the_amount_not_a_count', () => {
    expect(money('50 for lunch at 7')).toEqual(flagged('50'));
    expect(money('2 for 400')).toEqual(flagged('2'));
  });

  it('a_fractional_number_is_not_a_count_of_things', () => {
    expect(money('2.5 lunch for 400')).toEqual(flagged('2.5'));
  });

  it('a_quantity_that_is_the_only_number_is_kept_but_flagged', () => {
    expect(money('2 kilos of oranges')).toEqual(flagged('2'));
  });

  it('the_number_next_to_a_currency_word_still_wins (PQ-09)', () => {
    expect(money('50 pounds lunch for 20')).toEqual(flagged('50', 'EGP'));
    expect(money('3 kilos for 45 pounds')).toEqual(flagged('45', 'EGP'));
  });
});

describe('count times unit price, only with an explicit signal (T-007a)', () => {
  it('each_and_per_after_the_price', () => {
    expect(money('three movie tickets at 200 each')).toEqual(flagged('600'));
    expect(money('3 tickets 200 apiece')).toEqual(flagged('600'));
    expect(money('3 months at 250 per month')).toEqual(flagged('750'));
    expect(money('2 kilos at 40.50 per kilo')).toEqual(flagged('81'));
  });

  it('each_before_the_price', () => {
    expect(money('three tickets each 200')).toEqual(flagged('600'));
    expect(money('three tickets each for 200')).toEqual(flagged('600'));
    expect(money('three tickets each at 200')).toEqual(flagged('600'));
  });

  it('كل_واحد_or_واحدة_on_either_side_of_the_price', () => {
    expect(money('تلات تذاكر كل واحدة بميتين جنيه')).toEqual(flagged('600', 'EGP'));
    expect(money('تلات تذاكر كل واحده ميتين')).toEqual(flagged('600'));
    expect(money('خمس قمصان كل واحد ب 150 جنيه')).toEqual(flagged('750', 'EGP'));
    expect(money('تلات تذاكر بميتين كل واحدة')).toEqual(flagged('600'));
    expect(money('تلات تذاكر بميتين جنيه لكل واحدة')).toEqual(flagged('600', 'EGP'));
  });

  it('the_count_may_come_after_the_price', () => {
    expect(money('200 each for three tickets')).toEqual(flagged('600'));
    expect(money('three tickets, 200 for each')).toEqual(flagged('600'));
  });

  it('keeps_the_price_currency_and_is_exact', () => {
    expect(money('3 tickets at 12.25 dollars each', 'EGP')).toEqual(flagged('36.75', 'USD'));
    expect(money('3 tickets at 0.1 each')).toEqual(flagged('0.3'));
    expect(money('2 pens 75 piastres each', 'USD')).toEqual(flagged('1.5', 'EGP'));
  });

  it('no_count_means_no_multiplication_and_no_flag', () => {
    expect(money('200 each')).toEqual(clean('200', DEFAULT));
    expect(money('rent 5000 per month')).toEqual(clean('5000', DEFAULT));
    expect(money('كل واحدة بميتين')).toEqual(clean('200', DEFAULT));
  });

  it('a_count_must_be_a_whole_number_of_two_or_more_with_no_currency', () => {
    expect(money('one ticket at 200 each')).toEqual(flagged('200'));
    expect(money('2.5 tickets at 200 each')).toEqual(flagged('2.5'));
    expect(money('50 pounds lunch 20 each')).toEqual(flagged('50', 'EGP'));
  });

  it('without_a_signal_nothing_is_multiplied', () => {
    expect(money('three movie tickets at 200')).toEqual(flagged('200'));
  });
});

describe('water after a bill or another utility is not a hundred (T-007a, PQ-10)', () => {
  it('the_number_after_it_is_the_amount', () => {
    expect(money('فاتورة المية تسعة وأربعين جنيه وخمسة وعشرين قرش')).toEqual(clean('49.25', 'EGP'));
    expect(money('فاتورة المية خمسين')).toEqual(clean('50', DEFAULT));
    expect(money('فاتورة المية بميتين جنيه')).toEqual(clean('200', 'EGP'));
    expect(money('فواتير المية تلتمية')).toEqual(clean('300', DEFAULT));
  });

  it('after_another_utility_and_و', () => {
    expect(money('دفعت الكهربا والمية خمسمية جنيه')).toEqual(clean('500', 'EGP'));
    expect(money('الغاز والمية ميتين')).toEqual(clean('200', DEFAULT));
  });

  it('alone_it_gives_no_amount_rather_than_a_false_hundred', () => {
    expect(money('فاتورة المية')).toEqual({
      currency: DEFAULT,
      attention: { amount: true, currency: false },
    });
  });

  it('with_a_currency_word_or_a_compound_it_is_still_a_number', () => {
    expect(money('فاتورة مية جنيه')).toEqual(clean('100', 'EGP'));
    expect(money('فاتورة مية وخمسين جنيه')).toEqual(clean('150', 'EGP'));
    expect(money('فاتورة مية وخمسين')).toEqual(clean('150', DEFAULT));
    expect(money('فاتورة مية ألف')).toEqual(clean('100000', DEFAULT));
  });

  it('elsewhere_مية_is_a_hundred', () => {
    expect(money('صرفت مية')).toEqual(clean('100', DEFAULT));
    expect(money('تاكسي ومية')).toEqual(clean('100', DEFAULT));
  });
});
