import { describe, expect, it } from 'vitest';

import {
  CATEGORY_CODES,
  CATEGORY_KEYWORDS,
  CATEGORY_VOCABULARY,
  CURRENCY_VOCABULARY,
  DATE_VOCABULARY,
  findCategories,
  normalize,
  NUMBER_VOCABULARY,
  resolveCategory,
  UTTERANCE_VOCABULARY,
} from '../index.js';

const categoryOf = (text: string) => {
  const tokens = normalize(text, UTTERANCE_VOCABULARY);
  return resolveCategory(findCategories(tokens));
};

describe('category lexicon data', () => {
  it('has keywords for every category except Other, and only for listed categories', () => {
    const withKeywords = Object.keys(CATEGORY_KEYWORDS).sort();
    const expected = CATEGORY_CODES.filter((code) => code !== 'other').sort();
    expect(withKeywords).toEqual(expected);
    for (const keywords of Object.values(CATEGORY_KEYWORDS)) {
      expect(keywords.length).toBeGreaterThan(0);
    }
  });

  it('writes every keyword in its normalised form', () => {
    for (const keywords of Object.values(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        expect(normalize(keyword, UTTERANCE_VOCABULARY).join(' ')).toBe(keyword);
      }
    }
  });

  it('lists each keyword under one category only', () => {
    const all = Object.values(CATEGORY_KEYWORDS).flat();
    expect(new Set(all).size).toBe(all.length);
  });

  it('shares no word with the number, date or currency vocabularies', () => {
    for (const word of CATEGORY_VOCABULARY) {
      expect(NUMBER_VOCABULARY.has(word), word).toBe(false);
      expect(DATE_VOCABULARY.has(word), word).toBe(false);
      expect(CURRENCY_VOCABULARY.has(word), word).toBe(false);
    }
  });

  it('lists English keywords in Latin and in Arabic transliteration', () => {
    const groceries = CATEGORY_KEYWORDS.groceries;
    expect(groceries).toContain('supermarket');
    expect(groceries).toContain('سوبر ماركت');
    expect(CATEGORY_KEYWORDS.transport).toContain('uber');
    expect(CATEGORY_KEYWORDS.transport).toContain('اوبر');
    expect(CATEGORY_KEYWORDS.food_drink).toContain('lunch');
    expect(CATEGORY_KEYWORDS.food_drink).toContain('لانش');
  });

  it('the utterance vocabulary is the union of the number, date, currency and category words', () => {
    const union = new Set([
      ...NUMBER_VOCABULARY,
      ...DATE_VOCABULARY,
      ...CURRENCY_VOCABULARY,
      ...CATEGORY_VOCABULARY,
    ]);
    expect([...UTTERANCE_VOCABULARY].sort()).toEqual([...union].sort());
  });

  it('splits attached particles from category words', () => {
    expect(normalize('للتاكسي', UTTERANCE_VOCABULARY)).toEqual(['ل', 'تاكسي']);
    expect(normalize('بالكهربا', UTTERANCE_VOCABULARY)).toEqual(['ب', 'كهربا']);
    expect(categoryOf('دفعت للدكتورة')).toEqual({ category: 'health', attention: false });
  });
});

describe('category matching', () => {
  it('matches a phrase of several tokens as one keyword', () => {
    const tokens = normalize('السوبر ماركت', UTTERANCE_VOCABULARY);
    expect(findCategories(tokens)).toEqual([
      { start: 0, end: 2, category: 'groceries', fuzzy: false },
    ]);
  });

  it('agreeing words give one category, unflagged', () => {
    expect(categoryOf('فاتورة الكهربا')).toEqual({ category: 'bills_utilities', attention: false });
  });

  it('two categories: the first said is used and flagged', () => {
    expect(categoryOf('lunch then a taxi')).toEqual({ category: 'food_drink', attention: true });
    expect(categoryOf('تاكسي للسوبر ماركت')).toEqual({ category: 'transport', attention: true });
  });

  it('no keyword gives Other, flagged', () => {
    expect(categoryOf('صرفت مية جنيه')).toEqual({ category: 'other', attention: true });
    expect(categoryOf('')).toEqual({ category: 'other', attention: true });
  });
});

describe('fuzzy matching (ADR 0003 step 6)', () => {
  it('fuzzy_match_only_for_tokens_of_five_or_more_letters', () => {
    // Five letters, one substitution from "lunch": matches.
    expect(categoryOf('lunsh')).toEqual({ category: 'food_drink', attention: false });
    // Four letters, one deletion from "lunch": no match.
    expect(categoryOf('lnch')).toEqual({ category: 'other', attention: true });
    // Four letters, one substitution from "taxi": no match.
    expect(categoryOf('taxy')).toEqual({ category: 'other', attention: true });
    // Arabic, eight letters, one deletion from "سوبرماركت": matches.
    expect(categoryOf('سوبرمركت')).toEqual({ category: 'groceries', attention: false });
    // Arabic, four letters, one substitution from "تاكسي" (five): no match.
    expect(categoryOf('تكسي')).toEqual({ category: 'other', attention: true });
  });

  it('fuzzy-matches only keywords of five or more letters too', () => {
    // "small" is one insertion from the keyword "mall", which is too short to match fuzzily.
    expect(categoryOf('spent 50 on small things')).toEqual({ category: 'other', attention: true });
    expect(categoryOf('taxis')).toEqual({ category: 'other', attention: true });
  });

  it('allows an edit distance of one only', () => {
    expect(categoryOf('restaurent')).toEqual({ category: 'food_drink', attention: false });
    expect(categoryOf('restoranet')).toEqual({ category: 'other', attention: true });
    expect(categoryOf('lunchhh')).toEqual({ category: 'other', attention: true });
  });

  it('records which matches are fuzzy', () => {
    const tokens = normalize('pharmacyy', UTTERANCE_VOCABULARY);
    expect(findCategories(tokens)).toEqual([{ start: 0, end: 1, category: 'health', fuzzy: true }]);
  });

  it('an exact match wins over a fuzzy one', () => {
    // "supermarkt" is one edit from "supermarket", but "taxi" matches exactly.
    expect(categoryOf('taxi to the supermarkt')).toEqual({
      category: 'transport',
      attention: false,
    });
  });

  it('does not fuzzy-match number, date or currency words', () => {
    // "خمسين" and "dollars" are five letters or more; neither may become a category.
    expect(categoryOf('خمسين')).toEqual({ category: 'other', attention: true });
    expect(categoryOf('twenty dollars yesterday')).toEqual({ category: 'other', attention: true });
  });

  it('does not fuzzy-match tokens with digits', () => {
    expect(categoryOf('lunch5')).toEqual({ category: 'food_drink', attention: false });
    expect(findCategories(['taxi1'])).toEqual([]);
  });
});
