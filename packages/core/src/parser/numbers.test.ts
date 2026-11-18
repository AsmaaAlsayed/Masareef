import { describe, expect, it } from 'vitest';

import { findNumbers, normalize } from '../index.js';

const numbers = (text: string): string[] =>
  findNumbers(normalize(text)).map((match) => match.value);

describe('number grammar: Arabic words (ADR 0003 step 2)', () => {
  it('units_in_egyptian_and_standard_spellings', () => {
    const cases: [string, string][] = [
      ['صفر', '0'],
      ['واحد', '1'],
      ['واحدة', '1'],
      ['اتنين', '2'],
      ['اثنين', '2'],
      ['تلاتة', '3'],
      ['ثلاثة', '3'],
      ['تلات', '3'],
      ['أربعة', '4'],
      ['خمسة', '5'],
      ['ستة', '6'],
      ['سبعة', '7'],
      ['تمانية', '8'],
      ['ثمانية', '8'],
      ['تسعة', '9'],
      ['عشرة', '10'],
    ];
    for (const [word, value] of cases) {
      expect(numbers(word), word).toEqual([value]);
    }
  });

  it('teens_in_egyptian_and_standard_forms', () => {
    expect(numbers('حداشر')).toEqual(['11']);
    expect(numbers('اتناشر')).toEqual(['12']);
    expect(numbers('تلتاشر')).toEqual(['13']);
    expect(numbers('خمستاشر')).toEqual(['15']);
    expect(numbers('خمسطاشر')).toEqual(['15']);
    expect(numbers('تسعتاشر')).toEqual(['19']);
    expect(numbers('أحد عشر')).toEqual(['11']);
    expect(numbers('اثنا عشر')).toEqual(['12']);
    expect(numbers('خمسة عشر')).toEqual(['15']);
  });

  it('tens_hundreds_and_compounds_joined_by_و', () => {
    expect(numbers('عشرين')).toEqual(['20']);
    expect(numbers('ثلاثون')).toEqual(['30']);
    expect(numbers('خمسة وعشرين')).toEqual(['25']);
    expect(numbers('مية')).toEqual(['100']);
    expect(numbers('مائة')).toEqual(['100']);
    expect(numbers('ميتين')).toEqual(['200']);
    expect(numbers('مئتين')).toEqual(['200']);
    expect(numbers('تلتمية')).toEqual(['300']);
    expect(numbers('خمسمية')).toEqual(['500']);
    expect(numbers('خمسمائة')).toEqual(['500']);
    expect(numbers('خمس مية')).toEqual(['500']);
    expect(numbers('مية وخمسة وعشرين')).toEqual(['125']);
    expect(numbers('تسعمية وتسعة وتسعين')).toEqual(['999']);
  });

  it('thousands_and_millions', () => {
    expect(numbers('ألف')).toEqual(['1000']);
    expect(numbers('ألفين')).toEqual(['2000']);
    expect(numbers('ألفين وخمسمية')).toEqual(['2500']);
    expect(numbers('تلات تلاف')).toEqual(['3000']);
    expect(numbers('خمسة آلاف')).toEqual(['5000']);
    expect(numbers('خمسة وعشرين ألف')).toEqual(['25000']);
    expect(numbers('ميتين وخمسين ألف')).toEqual(['250000']);
    expect(numbers('مليون')).toEqual(['1000000']);
    expect(numbers('مليون وميتين ألف')).toEqual(['1200000']);
    expect(numbers('٣ آلاف')).toEqual(['3000']);
  });

  it('أحد_on_its_own_is_not_a_number (it is also Sunday)', () => {
    expect(numbers('يوم الأحد')).toEqual([]);
  });
});

describe('number grammar: English words', () => {
  it('units_teens_tens_and_compounds', () => {
    expect(numbers('zero')).toEqual(['0']);
    expect(numbers('seven')).toEqual(['7']);
    expect(numbers('thirteen')).toEqual(['13']);
    expect(numbers('ninety')).toEqual(['90']);
    expect(numbers('twenty five')).toEqual(['25']);
    expect(numbers('Twenty-Five')).toEqual(['25']);
  });

  it('hundreds_thousands_and_millions', () => {
    expect(numbers('a hundred')).toEqual(['100']);
    expect(numbers('hundred')).toEqual(['100']);
    expect(numbers('three hundred and five')).toEqual(['305']);
    expect(numbers('fifteen hundred')).toEqual(['1500']);
    expect(numbers('a thousand')).toEqual(['1000']);
    expect(numbers('two thousand and twenty')).toEqual(['2020']);
    expect(numbers('two million three hundred thousand')).toEqual(['2300000']);
  });

  it('a_on_its_own_is_not_a_number', () => {
    expect(numbers('a coffee')).toEqual([]);
  });
});

describe('number grammar: digits', () => {
  it('digits_in_either_script_with_separators', () => {
    expect(numbers('٥٠')).toEqual(['50']);
    expect(numbers('050')).toEqual(['50']);
    expect(numbers('1,250')).toEqual(['1250']);
    expect(numbers('1,250,000.50')).toEqual(['1250000.5']);
    expect(numbers('١٬٢٥٠٫٥٠')).toEqual(['1250.5']);
    expect(numbers('0.75')).toEqual(['0.75']);
    expect(numbers('2.5 thousand')).toEqual(['2500']);
    expect(numbers('5 hundred')).toEqual(['500']);
  });

  it('a_comma_that_is_not_a_thousands_separator_splits_two_numbers', () => {
    expect(numbers('5,5')).toEqual(['5', '5']);
    expect(numbers('50, 20')).toEqual(['50', '20']);
  });
});

describe('number grammar: conflicting and partial numbers', () => {
  it('adjacent_numbers_that_cannot_combine_are_separate', () => {
    expect(numbers('خمسين عشرين')).toEqual(['50', '20']);
    expect(numbers('fifty twenty')).toEqual(['50', '20']);
    expect(numbers('خمسة وخمسة')).toEqual(['5', '5']);
    expect(numbers('ألف وألف')).toEqual(['1000', '1000']);
    expect(numbers('50 20')).toEqual(['50', '20']);
    expect(numbers('fifty 20')).toEqual(['50', '20']);
    // Arabic puts the unit first only with "و"; "five twenty" is two numbers.
    expect(numbers('خمسة عشرين')).toEqual(['5', '20']);
    expect(numbers('five twenty')).toEqual(['5', '20']);
    // A scale word after "و" does not multiply what came before it.
    expect(numbers('خمسين وألف')).toEqual(['50', '1000']);
    // A dual already carries its count.
    expect(numbers('خمسة ألفين')).toEqual(['5', '2000']);
  });

  it('a_dangling_conjunction_ends_the_number', () => {
    expect(numbers('خمسة و')).toEqual(['5']);
    expect(numbers('fifty and')).toEqual(['50']);
    expect(numbers('fifty and lunch')).toEqual(['50']);
  });

  it('a_multiplier_with_nothing_to_multiply_is_not_a_number', () => {
    expect(numbers('آلاف')).toEqual([]);
    expect(numbers('thousands')).toEqual([]);
  });

  it('returns_token_positions', () => {
    const tokens = normalize('دفعت خمسة وعشرين للتاكسي');
    expect(findNumbers(tokens)).toEqual([{ value: '25', start: 1, end: 4 }]);
  });
});

describe('number grammar: forms found by the typed-transcript score (T-007a)', () => {
  it('the_construct_form_ميت_is_a_hundred', () => {
    expect(numbers('ميت')).toEqual(['100']);
    expect(numbers('بميت')).toEqual(['100']);
    expect(numbers('ميت ألف')).toEqual(['100000']);
    expect(numbers('ميت وخمسين')).toEqual(['150']);
  });

  it('hundreds_written_with_the_construct_form', () => {
    expect(numbers('تلتميت')).toEqual(['300']);
    expect(numbers('خمسميت')).toEqual(['500']);
    expect(numbers('تسعميت')).toEqual(['900']);
  });

  it('standard_arabic_construct_duals', () => {
    expect(numbers('مائتي')).toEqual(['200']);
    expect(numbers('مئتي')).toEqual(['200']);
    expect(numbers('بمائتي')).toEqual(['200']);
    expect(numbers('ألفي')).toEqual(['2000']);
    expect(numbers('مليوني')).toEqual(['2000000']);
  });

  it('thousands_fused_to_their_count', () => {
    const cases: [string, string][] = [
      ['تلاتلاف', '3000'],
      ['تلتلاف', '3000'],
      ['اربعتلاف', '4000'],
      ['خمستلاف', '5000'],
      ['خمستالاف', '5000'],
      ['ستلاف', '6000'],
      ['سبعتلاف', '7000'],
      ['تمنتلاف', '8000'],
      ['تمانتلاف', '8000'],
      ['تسعتلاف', '9000'],
      ['عشرتلاف', '10000'],
    ];
    for (const [word, value] of cases) {
      expect(numbers(word), word).toEqual([value]);
    }
  });

  it('a_fused_thousand_continues_like_any_thousand_and_takes_no_count_before_it', () => {
    expect(numbers('خمستلاف وخمسمية')).toEqual(['5500']);
    expect(numbers('بخمستلاف')).toEqual(['5000']);
    expect(numbers('اتنين خمستلاف')).toEqual(['2', '5000']);
    expect(numbers('٣ خمستلاف')).toEqual(['3', '5000']);
  });
});
