import { describe, expect, it } from 'vitest';

import {
  DATE_VOCABULARY,
  findAmounts,
  findDates,
  normalize,
  NUMBER_VOCABULARY,
  parseAmount,
  parseDate,
} from '../index.js';

/** Monday 16 November 2026, the "today" of the FR-027 examples. */
const TODAY = '2026-11-16';

const dateOf = (text: string, today = TODAY) => parseDate(text, today);
const resolved = (date: string) => ({ date, attention: false });
const flaggedToday = (today = TODAY) => ({ date: today, attention: true });

describe('FR-027 criterion 1: no date expression means today, unflagged', () => {
  it('no_date_is_today_unflagged', () => {
    expect(dateOf('صرفت خمسين جنيه على الغدا')).toEqual(resolved(TODAY));
    expect(dateOf('spent 50 pounds on lunch')).toEqual(resolved(TODAY));
    expect(dateOf('')).toEqual(resolved(TODAY));
  });

  it('today_is_the_injected_calendar_date_not_the_clock', () => {
    expect(dateOf('lunch 50', '2031-07-04')).toEqual(resolved('2031-07-04'));
  });

  it('number_words_that_are_also_weekday_names_are_not_dates_on_their_own', () => {
    // اتنين (2, Monday), تلات (3, Tuesday), اربع (4, Wednesday), حد (someone, Sunday).
    expect(dateOf('دفعت اتنين جنيه')).toEqual(resolved(TODAY));
    expect(dateOf('تلات جنيه عيش')).toEqual(resolved(TODAY));
    expect(dateOf('اربع تذاكر')).toEqual(resolved(TODAY));
    expect(dateOf('اديت حد خمسين جنيه')).toEqual(resolved(TODAY));
  });

  it('date_words_used_otherwise_are_not_dates', () => {
    expect(dateOf('اشتريت عيش من')).toEqual(resolved(TODAY));
    expect(dateOf('خمسين من خمسين')).toEqual(resolved(TODAY));
    expect(dateOf('من كارفور بخمسين')).toEqual(resolved(TODAY));
    expect(dateOf('من يوم ما جيت')).toEqual(resolved(TODAY));
    expect(dateOf('the last one cost 20')).toEqual(resolved(TODAY));
    expect(dateOf('next to the station 20 pounds')).toEqual(resolved(TODAY));
    expect(dateOf('five days')).toEqual(resolved(TODAY));
    expect(parseAmount('next to the station 20 pounds')?.amount).toBe('20');
  });
});

describe('FR-027 criterion 2: today, yesterday, the day before yesterday', () => {
  it('ar_امبارح_is_15_Nov', () => {
    expect(dateOf('امبارح')).toEqual(resolved('2026-11-15'));
  });

  it('en_yesterday_is_15_Nov', () => {
    expect(dateOf('yesterday')).toEqual(resolved('2026-11-15'));
  });

  it('ar_أول_امبارح_is_14_Nov', () => {
    expect(dateOf('أول امبارح')).toEqual(resolved('2026-11-14'));
  });

  it('en_the_day_before_yesterday_is_14_Nov', () => {
    expect(dateOf('the day before yesterday')).toEqual(resolved('2026-11-14'));
  });

  it('ar_النهارده_is_16_Nov', () => {
    expect(dateOf('النهارده')).toEqual(resolved('2026-11-16'));
  });

  it('en_today_is_16_Nov', () => {
    expect(dateOf('today')).toEqual(resolved('2026-11-16'));
  });

  it('spelling_variants_and_expressions_inside_sentences', () => {
    expect(dateOf('صرفت ميه جنيه إمبارح على البنزين')).toEqual(resolved('2026-11-15'));
    expect(dateOf('مبارح')).toEqual(resolved('2026-11-15'));
    expect(dateOf('أمس')).toEqual(resolved('2026-11-15'));
    expect(dateOf('بالأمس')).toEqual(resolved('2026-11-15'));
    expect(dateOf('البارحة')).toEqual(resolved('2026-11-15'));
    expect(dateOf('وامبارح دفعت عشرين')).toEqual(resolved('2026-11-15'));
    expect(dateOf('اول امس')).toEqual(resolved('2026-11-14'));
    expect(dateOf('spent 20 on taxi the day before yesterday')).toEqual(resolved('2026-11-14'));
    expect(dateOf('day before yesterday')).toEqual(resolved('2026-11-14'));
    expect(dateOf('Yesterday, 50 pounds.')).toEqual(resolved('2026-11-15'));
    expect(dateOf('النهاردة')).toEqual(resolved(TODAY));
    expect(dateOf('انهارده')).toEqual(resolved(TODAY));
    expect(dateOf('النهار ده')).toEqual(resolved(TODAY));
  });
});

describe('FR-027 criterion 3: N days ago', () => {
  it('ar_من_تلات_أيام_is_13_Nov', () => {
    expect(dateOf('من تلات أيام')).toEqual(resolved('2026-11-13'));
  });

  it('en_three_days_ago_is_13_Nov', () => {
    expect(dateOf('three days ago')).toEqual(resolved('2026-11-13'));
  });

  it('numbers_as_words_or_digits_in_either_script_and_both_introducers', () => {
    expect(dateOf('من ٣ أيام')).toEqual(resolved('2026-11-13'));
    expect(dateOf('من 3 ايام')).toEqual(resolved('2026-11-13'));
    expect(dateOf('قبل تلات أيام')).toEqual(resolved('2026-11-13'));
    expect(dateOf('من ثلاثة أيام')).toEqual(resolved('2026-11-13'));
    expect(dateOf('من خمستاشر يوم')).toEqual(resolved('2026-11-01'));
    expect(dateOf('من يومين')).toEqual(resolved('2026-11-14'));
    expect(dateOf('قبل يومين')).toEqual(resolved('2026-11-14'));
    expect(dateOf('3 days ago')).toEqual(resolved('2026-11-13'));
    expect(dateOf('twenty one days ago')).toEqual(resolved('2026-10-26'));
    expect(dateOf('a day ago')).toEqual(resolved('2026-11-15'));
  });

  it('N_days_ago_for_1_and_30', () => {
    expect(dateOf('1 day ago')).toEqual(resolved('2026-11-15'));
    expect(dateOf('one day ago')).toEqual(resolved('2026-11-15'));
    expect(dateOf('من يوم واحد')).toEqual(resolved('2026-11-15'));
    expect(dateOf('30 days ago')).toEqual(resolved('2026-10-17'));
    expect(dateOf('thirty days ago')).toEqual(resolved('2026-10-17'));
    expect(dateOf('من تلاتين يوم')).toEqual(resolved('2026-10-17'));
  });

  it('31_days_ago_is_unsupported_and_flagged', () => {
    expect(dateOf('31 days ago')).toEqual(flaggedToday());
    expect(dateOf('thirty one days ago')).toEqual(flaggedToday());
    expect(dateOf('من واحد وتلاتين يوم')).toEqual(flaggedToday());
  });

  it('zero_and_fractional_days_ago_are_unsupported_and_flagged', () => {
    expect(dateOf('0 days ago')).toEqual(flaggedToday());
    expect(dateOf('من 2.5 يوم')).toEqual(flaggedToday());
  });
});

describe('FR-027 criterion 4: last <weekday>', () => {
  it('ar_يوم_الجمعة_اللي_فات_on_Monday_16_Nov_is_13_Nov', () => {
    expect(dateOf('يوم الجمعة اللي فات')).toEqual(resolved('2026-11-13'));
  });

  it('en_last_Friday_on_Monday_16_Nov_is_13_Nov', () => {
    expect(dateOf('last Friday')).toEqual(resolved('2026-11-13'));
  });

  it('every_weekday_in_both_languages', () => {
    expect(dateOf('last sunday')).toEqual(resolved('2026-11-15'));
    expect(dateOf('last tuesday')).toEqual(resolved('2026-11-10'));
    expect(dateOf('last wednesday')).toEqual(resolved('2026-11-11'));
    expect(dateOf('last thursday')).toEqual(resolved('2026-11-12'));
    expect(dateOf('last saturday')).toEqual(resolved('2026-11-14'));
    expect(dateOf('يوم الحد اللي فات')).toEqual(resolved('2026-11-15'));
    expect(dateOf('الأحد الماضي')).toEqual(resolved('2026-11-15'));
    expect(dateOf('التلات اللي فات')).toEqual(resolved('2026-11-10'));
    expect(dateOf('الثلاثاء الماضي')).toEqual(resolved('2026-11-10'));
    expect(dateOf('الأربعاء اللي فات')).toEqual(resolved('2026-11-11'));
    expect(dateOf('يوم الخميس الماضي')).toEqual(resolved('2026-11-12'));
    expect(dateOf('الجمعة اللي فاتت')).toEqual(resolved('2026-11-13'));
    expect(dateOf('الجمعة الماضية')).toEqual(resolved('2026-11-13'));
    expect(dateOf('السبت اللى فات')).toEqual(resolved('2026-11-14'));
  });

  it('last_weekday_said_on_that_weekday_is_7_days_earlier', () => {
    expect(dateOf('last monday')).toEqual(resolved('2026-11-09'));
    expect(dateOf('يوم الاتنين اللي فات')).toEqual(resolved('2026-11-09'));
    expect(dateOf('الاتنين اللي فات')).toEqual(resolved('2026-11-09'));
  });
});

describe('FR-027 criterion 5: month, year and leap-year boundaries', () => {
  it('yesterday_on_first_of_month', () => {
    expect(dateOf('yesterday', '2026-12-01')).toEqual(resolved('2026-11-30'));
    expect(dateOf('امبارح', '2026-03-01')).toEqual(resolved('2026-02-28'));
    expect(dateOf('yesterday', '2026-05-01')).toEqual(resolved('2026-04-30'));
  });

  it('yesterday_on_first_of_year', () => {
    expect(dateOf('yesterday', '2027-01-01')).toEqual(resolved('2026-12-31'));
    expect(dateOf('امبارح', '2027-01-01')).toEqual(resolved('2026-12-31'));
  });

  it('yesterday_on_1_March_of_a_leap_year_is_29_February', () => {
    expect(dateOf('yesterday', '2028-03-01')).toEqual(resolved('2028-02-29'));
    expect(dateOf('من 30 يوم', '2028-03-15')).toEqual(resolved('2028-02-14'));
    expect(dateOf('yesterday', '2000-03-01')).toEqual(resolved('2000-02-29'));
    expect(dateOf('yesterday', '2100-03-01')).toEqual(resolved('2100-02-28'));
  });

  it('last_weekday_across_a_year_boundary', () => {
    // 1 January 2027 is a Friday.
    expect(dateOf('last friday', '2027-01-02')).toEqual(resolved('2027-01-01'));
    expect(dateOf('last friday', '2027-01-01')).toEqual(resolved('2026-12-25'));
  });
});

describe('FR-027 criterion 6: future and unsupported expressions give today, flagged', () => {
  it('tomorrow_is_today_and_flagged', () => {
    expect(dateOf('tomorrow')).toEqual(flaggedToday());
    expect(dateOf('بكرة')).toEqual(flaggedToday());
    expect(dateOf('بكرا')).toEqual(flaggedToday());
    expect(dateOf('بعد بكرة')).toEqual(flaggedToday());
    expect(dateOf('the day after tomorrow')).toEqual(flaggedToday());
  });

  it('next_weekday_and_next_period_are_future_and_flagged', () => {
    expect(dateOf('next friday')).toEqual(flaggedToday());
    expect(dateOf('next week')).toEqual(flaggedToday());
    expect(dateOf('الجمعة الجاية')).toEqual(flaggedToday());
    expect(dateOf('الشهر الجاي')).toEqual(flaggedToday());
  });

  it('periods_other_than_days_are_unsupported_and_flagged', () => {
    expect(dateOf('last week')).toEqual(flaggedToday());
    expect(dateOf('last month')).toEqual(flaggedToday());
    expect(dateOf('last night')).toEqual(flaggedToday());
    expect(dateOf('two weeks ago')).toEqual(flaggedToday());
    expect(dateOf('a month ago')).toEqual(flaggedToday());
    expect(dateOf('الشهر اللي فات')).toEqual(flaggedToday());
    expect(dateOf('الاسبوع الماضي')).toEqual(flaggedToday());
    expect(dateOf('من اسبوع')).toEqual(flaggedToday());
    expect(dateOf('من اسبوعين')).toEqual(flaggedToday());
    expect(dateOf('من تلات شهور')).toEqual(flaggedToday());
  });

  it('a_weekday_without_last_is_ambiguous_and_flagged', () => {
    expect(dateOf('on friday')).toEqual(flaggedToday());
    expect(dateOf('يوم الجمعة')).toEqual(flaggedToday());
    expect(dateOf('يوم الاتنين')).toEqual(flaggedToday());
    expect(dateOf('الخميس')).toEqual(flaggedToday());
  });

  it('calendar_dates_with_a_month_name_are_unsupported_and_flagged', () => {
    expect(dateOf('on 5 november')).toEqual(flaggedToday());
    expect(dateOf('november 5th')).toEqual(flaggedToday());
    expect(dateOf('يوم ١٠ نوفمبر')).toEqual(flaggedToday());
    expect(dateOf('في مارس')).toEqual(flaggedToday());
    expect(dateOf('november 50 pounds')).toEqual(flaggedToday());
    expect(parseAmount('november 50 pounds')?.amount).toBe('50');
  });

  it('two_expressions_that_disagree_are_flagged', () => {
    expect(dateOf('امبارح والنهارده')).toEqual(flaggedToday());
    expect(dateOf('yesterday or tomorrow')).toEqual(flaggedToday());
  });

  it('two_expressions_that_agree_are_not_flagged', () => {
    expect(dateOf('yesterday, last sunday')).toEqual(resolved('2026-11-15'));
  });
});

describe('the injected today must be a real calendar date', () => {
  it('rejects_malformed_or_impossible_dates', () => {
    for (const today of ['', '16/11/2026', '2026-11-6', '2026-13-01', '2026-00-10', '2026-02-29']) {
      expect(() => parseDate('yesterday', today), today).toThrow(RangeError);
    }
  });

  it('accepts_29_February_in_a_leap_year', () => {
    expect(dateOf('today', '2028-02-29')).toEqual(resolved('2028-02-29'));
  });
});

describe('a number consumed by a date expression cannot become the amount', () => {
  it('من_تلات_أيام_number_not_used_as_amount', () => {
    expect(parseAmount('اشتريت عيش من تلات أيام')).toBeUndefined();
    expect(parseAmount('دفعت خمسين جنيه من تلات أيام')?.amount).toBe('50');
    expect(parseAmount('من تلات أيام دفعت خمسين جنيه')?.amount).toBe('50');
  });

  it('english_and_digit_forms_and_unsupported_counts_are_consumed_too', () => {
    expect(parseAmount('bought bread three days ago')).toBeUndefined();
    expect(parseAmount('paid fifty pounds 3 days ago')?.amount).toBe('50');
    expect(parseAmount('من ٣ أيام')).toBeUndefined();
    expect(parseAmount('31 days ago')).toBeUndefined();
    expect(parseAmount('two weeks ago')).toBeUndefined();
    expect(parseAmount('يوم الاتنين اللي فات')).toBeUndefined();
    expect(parseAmount('on 5 november')).toBeUndefined();
  });

  it('find_dates_returns_token_spans_that_find_amounts_skips', () => {
    const tokens = normalize(
      'دفعت خمسين جنيه من تلات أيام',
      new Set([...NUMBER_VOCABULARY, ...DATE_VOCABULARY]),
    );
    expect(tokens).toEqual(['دفعت', 'خمسين', 'جنيه', 'من', 'تلات', 'ايام']);
    const dates = findDates(tokens);
    expect(dates).toEqual([{ start: 3, end: 6, expression: { kind: 'daysAgo', days: 3 } }]);
    expect(findAmounts(tokens).map(({ amount }) => amount)).toEqual(['50', '3']);
    expect(findAmounts(tokens, dates)).toEqual([{ amount: '50', start: 1, end: 3 }]);
  });

  it('find_amounts_reads_between_excluded_spans_in_any_order_and_never_into_them', () => {
    const tokens = ['5', 'x', '6', 'y', 'خمسه', 'جنيه', 'ونص', '7'];
    const excluded = [
      { start: 5, end: 7 },
      { start: 1, end: 2 },
    ];
    // "خمسه" may not take the pound word and the half that lie in the excluded span.
    expect(findAmounts(tokens, excluded)).toEqual([
      { amount: '5', start: 0, end: 1 },
      { amount: '6', start: 2, end: 3 },
      { amount: '5', start: 4, end: 5 },
      { amount: '7', start: 7, end: 8 },
    ]);
  });
});
