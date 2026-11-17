import { describe, expect, it } from 'vitest';

import {
  fromMinor,
  parseUtterance,
  toMinor,
  type CategoryCode,
  type CurrencyCode,
  type Language,
  type ParsedUtterance,
} from '../index.js';

const TODAY = '2026-11-16';
const YESTERDAY = '2026-11-15';

/** Not EGP, so a test can tell "EGP because pounds were said" from "EGP by default". */
const DEFAULT: CurrencyCode = 'SAR';

const parse = (text: string, language: Language = 'ar') =>
  parseUtterance(text, { language, defaultCurrency: DEFAULT, today: TODAY });

/** The amount as the review screen would show it ("50.00"), through the T-002 helpers. */
function shown(result: ParsedUtterance): string | undefined {
  if (result.amount === undefined) {
    return undefined;
  }
  const minor = toMinor(result.amount, result.currency);
  if (!minor.ok) {
    throw new Error(`"${result.amount}" did not convert: ${minor.reason}`);
  }
  return fromMinor(minor.minor, result.currency);
}

const category = (text: string, language: Language = 'ar'): CategoryCode =>
  parse(text, language).category;

describe('parseUtterance result shape (architecture C4)', () => {
  it('returns amount, currency, category, date, attention per field and the text', () => {
    const text = 'صرفت خمسين جنيه على الغدا';
    expect(parse(text)).toEqual({
      amount: '50',
      currency: 'EGP',
      category: 'food_drink',
      date: TODAY,
      attention: { amount: false, currency: false, category: false, date: false },
      text,
    });
  });

  it('keeps the transcript exactly as recognised', () => {
    const text = '  Spent ٥٠ Pounds on LUNCH!  ';
    expect(parse(text, 'en').text).toBe(text);
  });

  it('omits the amount key when there is no amount', () => {
    expect('amount' in parse('اشتريت غدا')).toBe(false);
  });

  it('rejects an unknown language, currency or malformed today as programming errors', () => {
    const options = { language: 'ar' as Language, defaultCurrency: DEFAULT, today: TODAY };
    expect(() => parseUtterance('x', { ...options, language: 'fr' as Language })).toThrow(
      RangeError,
    );
    expect(() =>
      parseUtterance('x', { ...options, defaultCurrency: 'JPY' as CurrencyCode }),
    ).toThrow(RangeError);
    expect(() => parseUtterance('x', { ...options, today: '16/11/2026' })).toThrow(RangeError);
  });
});

describe('FR-026 criterion 1: lunch is Food and drink', () => {
  it('ar_صرفت_خمسين_جنيه_على_الغدا_is_food_drink', () => {
    expect(category('صرفت خمسين جنيه على الغدا')).toBe('food_drink');
  });

  it('en_spent_50_pounds_on_lunch_is_food_drink', () => {
    const result = parse('spent 50 pounds on lunch', 'en');
    expect(result.category).toBe('food_drink');
    expect(result.attention.category).toBe(false);
    expect(shown(result)).toBe('50.00');
  });
});

describe('FR-026 criterion 2: taxi is Transport, the electricity bill is Bills and utilities', () => {
  it('ar_تاكسي_بتلاتين_جنيه_is_transport', () => {
    const result = parse('تاكسي بتلاتين جنيه');
    expect(result.category).toBe('transport');
    expect(shown(result)).toBe('30.00');
  });

  it('en_30_pounds_for_a_taxi_is_transport', () => {
    expect(category('30 pounds for a taxi', 'en')).toBe('transport');
  });

  it('ar_فاتورة_الكهربا_٤٠٠_جنيه_is_bills_utilities', () => {
    const result = parse('فاتورة الكهربا ٤٠٠ جنيه');
    expect(result.category).toBe('bills_utilities');
    expect(result.attention.category).toBe(false);
    expect(shown(result)).toBe('400.00');
  });

  it('en_electricity_bill_400_pounds_is_bills_utilities', () => {
    expect(category('electricity bill 400 pounds', 'en')).toBe('bills_utilities');
  });
});

describe('FR-026 criterion 3: no category word gives Other, marked', () => {
  it('ar_صرفت_مية_جنيه_is_other_flagged', () => {
    const result = parse('صرفت مية جنيه');
    expect(result.category).toBe('other');
    expect(result.attention.category).toBe(true);
    expect(shown(result)).toBe('100.00');
    expect(result.attention.date).toBe(false);
  });

  it('en_spent_100_pounds_is_other_flagged', () => {
    const result = parse('spent 100 pounds', 'en');
    expect(result.category).toBe('other');
    expect(result.attention.category).toBe(true);
  });
});

describe('FR-029: mixed Arabic and English speech', () => {
  it('c1_دفعت_خمسين_جنيه_في_الـ_supermarket', () => {
    const result = parse('دفعت خمسين جنيه في الـ supermarket');
    expect(shown(result)).toBe('50.00');
    expect(result.category).toBe('groceries');
    expect(result.date).toBe(TODAY);
    expect(result.attention).toEqual({
      amount: false,
      currency: false,
      category: false,
      date: false,
    });
  });

  it('c1_variant_article_joined_to_the_latin_word', () => {
    expect(category('دفعت خمسين جنيه في الـsupermarket')).toBe('groceries');
  });

  it('c1_transliterated_سوبر_ماركت', () => {
    expect(category('دفعت خمسين جنيه في السوبر ماركت')).toBe('groceries');
  });

  it('c2_جبت_lunch_بمية_وعشرين_جنيه_امبارح', () => {
    const result = parse('جبت lunch بمية وعشرين جنيه امبارح');
    expect(shown(result)).toBe('120.00');
    expect(result.category).toBe('food_drink');
    expect(result.date).toBe(YESTERDAY);
    expect(result.attention).toEqual({
      amount: false,
      currency: false,
      category: false,
      date: false,
    });
  });

  it('c2_transliterated_لانش', () => {
    expect(category('جبت لانش بمية وعشرين جنيه امبارح')).toBe('food_drink');
  });

  it('c3_Uber_بخمسة_وأربعين_جنيه', () => {
    const result = parse('Uber بخمسة وأربعين جنيه');
    expect(shown(result)).toBe('45.00');
    expect(result.category).toBe('transport');
  });

  it('c3_transliterated_أوبر_with_attached_particle', () => {
    expect(category('دفعت للأوبر خمسة وأربعين جنيه')).toBe('transport');
  });

  it('mixed speech works whichever language the recogniser was told', () => {
    expect(category('Uber بخمسة وأربعين جنيه', 'en')).toBe('transport');
    expect(category('spent 50 pounds on lunch', 'ar')).toBe('food_drink');
  });
});

describe('FR-030 criterion 4: an amount alone', () => {
  it('amount_only_gives_Other_flagged_and_today', () => {
    for (const text of ['خمسين جنيه', 'fifty pounds']) {
      const result = parse(text);
      expect(shown(result)).toBe('50.00');
      expect(result.category).toBe('other');
      expect(result.date).toBe(TODAY);
      expect(result.attention).toEqual({
        amount: false,
        currency: false,
        category: true,
        date: false,
      });
    }
  });
});

describe('FR-030 criterion 1: nothing extractable', () => {
  it('nothing_extractable_flags_all_three', () => {
    for (const text of ['ماشي يا عم', 'hello there', 'ok']) {
      const result = parse(text);
      expect(result.amount).toBeUndefined();
      expect(result.category).toBe('other');
      expect(result.date).toBe(TODAY);
      expect(result.currency).toBe(DEFAULT);
      expect(result.attention).toEqual({
        amount: true,
        currency: false,
        category: true,
        date: true,
      });
      expect(result.text).toBe(text);
    }
  });

  it('a category alone does not flag the date', () => {
    const result = parse('اشتريت غدا');
    expect(result.amount).toBeUndefined();
    expect(result.category).toBe('food_drink');
    expect(result.attention).toEqual({
      amount: true,
      currency: false,
      category: false,
      date: false,
    });
  });

  it('a date alone does not flag the date', () => {
    const result = parse('امبارح');
    expect(result.date).toBe(YESTERDAY);
    expect(result.attention).toEqual({
      amount: true,
      currency: false,
      category: true,
      date: false,
    });
  });

  it('empty and punctuation-only text flags all three', () => {
    for (const text of ['', '   ', '؟!']) {
      expect(parse(text).attention).toEqual({
        amount: true,
        currency: false,
        category: true,
        date: true,
      });
    }
  });
});

describe('FR-029 criterion 5: an utterance mostly in another language', () => {
  const allFlagged = { amount: true, currency: true, category: true, date: true };

  it('other_language_text_flags_all', () => {
    for (const text of [
      'Я потратил пятьдесят фунтов на обед',
      '我花了五十镑吃午饭',
      'मैंने दोपहर के खाने पर पचास पाउंड खर्च किए',
      'J’ai dépensé été café déjeuné',
    ]) {
      const result = parse(text);
      expect(result.attention).toEqual(allFlagged);
      expect(result.amount).toBeUndefined();
      expect(result.category).toBe('other');
      expect(result.date).toBe(TODAY);
      expect(result.currency).toBe(DEFAULT);
      expect(result.text).toBe(text);
    }
  });

  it('flags all and drops fields even when an Arabic or English word is understood', () => {
    // Four of six words are Cyrillic: the taxi and the pounds are not trusted.
    const result = parse('taxi 50 pounds Я потратил пятьдесят фунтов');
    expect(result.attention).toEqual(allFlagged);
    expect(result.amount).toBeUndefined();
    expect(result.category).toBe('other');
  });

  it('a few foreign words inside Arabic or English speech are not another language', () => {
    expect(parse('spent 50 pounds on lunch at the café').attention.category).toBe(false);
    expect(parse('دفعت خمسين جنيه في الـ supermarket Привет').category).toBe('groceries');
  });

  it('exactly half the words in another language is not "mostly"', () => {
    const result = parse('taxi 50 pounds Я потратил');
    expect(result.category).toBe('transport');
    expect(result.attention.category).toBe(false);
  });
});
