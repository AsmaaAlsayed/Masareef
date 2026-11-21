import { describe, expect, it } from 'vitest';
import { checkTranslations } from './check.js';
import { TRANSLATIONS } from './index.js';

describe('translation key check (NFR-009)', () => {
  it('the_shipped_resources_pass', () => {
    expect(checkTranslations(TRANSLATIONS)).toEqual([]);
  });

  it('missing_arabic_key_fails_key_check', () => {
    const problems = checkTranslations({
      en: { app: { name: 'Masareef', tagline: 'Track spending' } },
      ar: { app: { name: 'مصاريف' } },
    });
    expect(problems).toEqual([{ language: 'ar', key: 'app.tagline', problem: 'missing' }]);
  });

  it('missing_english_key_fails_key_check', () => {
    const problems = checkTranslations({
      en: { app: { name: 'Masareef' } },
      ar: { app: { name: 'مصاريف', tagline: 'تتبع المصاريف' } },
    });
    expect(problems).toEqual([{ language: 'en', key: 'app.tagline', problem: 'missing' }]);
  });

  it('a_missing_group_reports_every_key_in_it', () => {
    const problems = checkTranslations({
      en: { a: { x: 'x', y: 'y' } },
      ar: {},
    });
    expect(problems).toEqual([
      { language: 'ar', key: 'a.x', problem: 'missing' },
      { language: 'ar', key: 'a.y', problem: 'missing' },
    ]);
  });

  it('empty_or_blank_value_fails_key_check', () => {
    const problems = checkTranslations({
      en: { a: '', b: 'b' },
      ar: { a: 'أ', b: '  ' },
    });
    expect(problems).toEqual([
      { language: 'en', key: 'a', problem: 'empty' },
      { language: 'ar', key: 'b', problem: 'empty' },
    ]);
  });

  it('a_text_where_the_other_language_has_a_group_fails', () => {
    const problems = checkTranslations({
      en: { a: { b: 'b' } },
      ar: { a: 'أ' },
    });
    expect(problems).toContainEqual({ language: 'ar', key: 'a', problem: 'not_text' });
    expect(problems).toContainEqual({ language: 'ar', key: 'a.b', problem: 'missing' });
  });

  it('arabic_indic_digits_fail_key_check', () => {
    const problems = checkTranslations({
      en: { a: 'Page 5' },
      ar: { a: 'صفحة ٥' },
    });
    expect(problems).toEqual([{ language: 'ar', key: 'a', problem: 'non_western_digit' }]);
  });

  it('extended_arabic_indic_digits_fail_key_check', () => {
    const problems = checkTranslations({ en: { a: 'Page 5' }, ar: { a: 'صفحة ۵' } });
    expect(problems).toEqual([{ language: 'ar', key: 'a', problem: 'non_western_digit' }]);
  });

  it('placeholders_must_match_between_languages', () => {
    const problems = checkTranslations({
      en: { a: 'Release {{release}}' },
      ar: { a: 'الإصدار {{version}}' },
    });
    expect(problems).toEqual([{ language: 'ar', key: 'a', problem: 'placeholders_differ' }]);
  });

  it('no_resources_at_all_is_not_a_pass', () => {
    expect(checkTranslations({ en: {}, ar: {} })).toEqual([
      { language: 'en', key: '', problem: 'missing' },
      { language: 'ar', key: '', problem: 'missing' },
    ]);
  });
});
