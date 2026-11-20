import { describe, expect, it } from 'vitest';
import { isLanguage, languageFromPreferences, textDirection } from './language.js';

describe('languageFromPreferences (FR-021 criteria 1 and 2)', () => {
  for (const tag of ['ar', 'ar-EG', 'ar-SA', 'AR-eg', 'ar-Arab-EG']) {
    it(`arabic_variant_${tag}_gives_arabic`, () => {
      expect(languageFromPreferences([tag])).toBe('ar');
    });
  }

  for (const tag of ['fr', 'fr-FR', 'de', 'zh-Hans-CN', 'arn', 'art-lojban', '']) {
    it(`unoffered_language_${tag || 'empty'}_gives_english`, () => {
      expect(languageFromPreferences([tag])).toBe('en');
    });
  }

  it('english_gives_english', () => {
    expect(languageFromPreferences(['en-GB'])).toBe('en');
  });

  it('an_empty_list_gives_english', () => {
    expect(languageFromPreferences([])).toBe('en');
  });

  it('the_first_offered_language_in_preference_order_wins', () => {
    expect(languageFromPreferences(['en-US', 'ar-EG'])).toBe('en');
    expect(languageFromPreferences(['ar-EG', 'en-US'])).toBe('ar');
    expect(languageFromPreferences(['fr-FR', 'ar-EG'])).toBe('ar');
  });
});

describe('textDirection', () => {
  it('arabic_is_rtl_and_english_ltr', () => {
    expect(textDirection('ar')).toBe('rtl');
    expect(textDirection('en')).toBe('ltr');
  });
});

describe('isLanguage', () => {
  it('accepts_only_the_two_codes', () => {
    expect(isLanguage('ar')).toBe(true);
    expect(isLanguage('en')).toBe(true);
    for (const value of ['AR', 'ar-EG', 'fr', '', null, undefined, 1]) {
      expect(isLanguage(value)).toBe(false);
    }
  });
});
