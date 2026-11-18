import { describe, expect, it } from 'vitest';

import { normalize } from '../index.js';

describe('normalize (ADR 0003 step 1)', () => {
  it('splits_on_whitespace_and_returns_no_tokens_for_empty_text', () => {
    expect(normalize('صرفت  خمسين\tجنيه')).toEqual(['صرفت', 'خمسين', 'جنيه']);
    expect(normalize('')).toEqual([]);
    expect(normalize(' \n ')).toEqual([]);
  });

  it('removes_diacritics_and_tatweel', () => {
    expect(normalize('خَمْسِينَ')).toEqual(['خمسين']);
    expect(normalize('خمـــسين')).toEqual(['خمسين']);
  });

  it('unifies_alef_ya_and_ta_marbuta', () => {
    expect(normalize('أإآٱا')).toEqual(['ااااا']);
    expect(normalize('على')).toEqual(['علي']);
    expect(normalize('خمسة')).toEqual(['خمسه']);
  });

  it('applies_nfkc', () => {
    // Arabic presentation forms (from some keyboards and PDFs) become the base letters.
    expect(normalize('ﻣﻴﺓ')).toEqual(['ميه']);
    expect(normalize('ｆｉｆｔｙ')).toEqual(['fifty']);
  });

  it('maps_arabic_indic_and_eastern_arabic_digits_to_western', () => {
    expect(normalize('٥٠ ۷۵')).toEqual(['50', '75']);
  });

  it('keeps_decimal_points_and_drops_thousands_separators_inside_numbers', () => {
    expect(normalize('1,250.50')).toEqual(['1250.50']);
    expect(normalize('١٬٢٥٠٫٥٠')).toEqual(['1250.50']);
    expect(normalize('50.')).toEqual(['50']);
  });

  it('lower_cases_latin_and_strips_punctuation', () => {
    expect(normalize('Spent 50 Pounds, on LUNCH!')).toEqual([
      'spent',
      '50',
      'pounds',
      'on',
      'lunch',
    ]);
    expect(normalize('صرفت، خمسين؟ (جنيه)')).toEqual(['صرفت', 'خمسين', 'جنيه']);
    expect(normalize('twenty-five')).toEqual(['twenty', 'five']);
  });

  it('splits_digits_from_letters_and_arabic_from_latin', () => {
    expect(normalize('50جنيه')).toEqual(['50', 'جنيه']);
    expect(normalize('50pounds')).toEqual(['50', 'pounds']);
    expect(normalize('ب50')).toEqual(['ب', '50']);
    expect(normalize('الـsupermarket')).toEqual(['supermarket']);
  });

  it('splits_attached_particles_from_known_words', () => {
    expect(normalize('بخمسين')).toEqual(['ب', 'خمسين']);
    expect(normalize('وربع')).toEqual(['و', 'ربع']);
    expect(normalize('ونص')).toEqual(['و', 'نص']);
    expect(normalize('وميتين')).toEqual(['و', 'ميتين']);
    expect(normalize('بالخمسين')).toEqual(['ب', 'خمسين']);
  });

  it('does_not_split_words_that_start_with_a_particle_letter', () => {
    expect(normalize('واحد')).toEqual(['واحد']);
    expect(normalize('ألف')).toEqual(['الف']);
    expect(normalize('بقالة')).toEqual(['بقاله']);
  });

  it('drops_the_definite_article_and_the_tatweel_joined_form', () => {
    expect(normalize('الغدا')).toEqual(['غدا']);
    expect(normalize('في الـ supermarket')).toEqual(['في', 'supermarket']);
    expect(normalize('الـ')).toEqual([]);
  });

  it('keeps_currency_symbols_as_tokens_of_their_own', () => {
    expect(normalize('$15')).toEqual(['$', '15']);
    expect(normalize('40€.')).toEqual(['40', '€']);
    expect(normalize('E£50 £5')).toEqual(['e£', '50', '£', '5']);
    expect(normalize('the£5')).toEqual(['the', '£', '5']);
  });

  it('reads_both_riyal_signs_as_one_symbol', () => {
    expect(normalize('﷼50')).toEqual(['\u20C1', '50']);
    expect(normalize('\u20C150')).toEqual(['\u20C1', '50']);
  });

  it('accepts_a_vocabulary_so_later_lexicons_can_protect_and_split_their_words', () => {
    const vocabulary = new Set(['تاكسي']);
    expect(normalize('والتاكسي', vocabulary)).toEqual(['و', 'تاكسي']);
    expect(normalize('للتاكسي', vocabulary)).toEqual(['ل', 'تاكسي']);
    expect(normalize('بخمسين', vocabulary)).toEqual(['بخمسين']);
  });
});
