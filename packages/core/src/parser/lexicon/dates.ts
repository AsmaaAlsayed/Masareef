/**
 * Date words for the utterance parser (ADR 0003 step 3, FR-027).
 *
 * Every word is written in its normalised form (see `normalize`): no diacritics, alef forms
 * written as ا, ى written as ي, ة written as ه, the definite article dropped ("النهاردة" is
 * read as "نهارده"), Latin in lower case. Phrases are token sequences. This list is the
 * team's draft and is reviewed by a native Egyptian Arabic speaker before release (OQ-03,
 * T-085).
 *
 * Supported in R1 (FR-027): today, yesterday, the day before yesterday, N days ago for N from
 * 1 to 30, and last <weekday>. Everything else listed here is recognised only so that it can
 * be flagged for the user's attention (FR-027 criterion 6) and its numbers kept out of the
 * amount.
 */

/** Fixed phrases and how many days before today they mean. */
export const RELATIVE_DAY_PHRASES: readonly {
  readonly words: readonly string[];
  readonly daysAgo: number;
}[] = [
  { words: ['today'], daysAgo: 0 },
  { words: ['نهارده'], daysAgo: 0 },
  { words: ['انهارده'], daysAgo: 0 },
  { words: ['نهار', 'ده'], daysAgo: 0 },
  { words: ['yesterday'], daysAgo: 1 },
  { words: ['امبارح'], daysAgo: 1 },
  { words: ['مبارح'], daysAgo: 1 },
  { words: ['امس'], daysAgo: 1 },
  { words: ['بارحه'], daysAgo: 1 },
  { words: ['the', 'day', 'before', 'yesterday'], daysAgo: 2 },
  { words: ['day', 'before', 'yesterday'], daysAgo: 2 },
  { words: ['اول', 'امبارح'], daysAgo: 2 },
  { words: ['اول', 'مبارح'], daysAgo: 2 },
  { words: ['اول', 'امس'], daysAgo: 2 },
];

/** Fixed phrases that refer to the future. */
export const FUTURE_PHRASES: readonly (readonly string[])[] = [
  ['tomorrow'],
  ['the', 'day', 'after', 'tomorrow'],
  ['day', 'after', 'tomorrow'],
  ['بكره'],
  ['بكرا'],
  ['بعد', 'بكره'],
  ['بعد', 'بكرا'],
];

/** Weekday names, Sunday = 0 to Saturday = 6. */
export const WEEKDAY_WORDS: Readonly<Record<string, number>> = Object.freeze({
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  حد: 0,
  احد: 0,
  اتنين: 1,
  اثنين: 1,
  تلات: 2,
  ثلاث: 2,
  تلاتاء: 2,
  ثلاثاء: 2,
  اربع: 3,
  اربعاء: 3,
  اربعا: 3,
  خميس: 4,
  جمعه: 5,
  سبت: 6,
});

/**
 * Weekday names that are also numbers ("اتنين" is 2) or common words ("حد" is someone). They
 * are read as a weekday only after "يوم" or before a past or future marker; otherwise they
 * are left to the number grammar.
 */
export const AMBIGUOUS_WEEKDAY_WORDS: ReadonlySet<string> = new Set([
  'حد',
  'احد',
  'اتنين',
  'اثنين',
  'تلات',
  'ثلاث',
  'اربع',
]);

/** "يوم" before a weekday name: "يوم الجمعة". */
export const DAY_PREFIX = 'يوم';

/** Arabic markers after a weekday or period that mean the one before now. */
export const PAST_MARKERS: readonly (readonly string[])[] = [
  ['اللي', 'فات'],
  ['اللي', 'فاتت'],
  ['الي', 'فات'],
  ['الي', 'فاتت'],
  ['ماضي'],
  ['ماضيه'],
];

/** Arabic markers after a weekday or period that mean the next one. */
export const FUTURE_MARKERS: readonly (readonly string[])[] = [
  ['اللي', 'جاي'],
  ['اللي', 'جايه'],
  ['جاي'],
  ['جايه'],
  ['قادم'],
  ['قادمه'],
];

/** English words before a weekday or period. */
export const LAST_WORD = 'last';
export const NEXT_WORD = 'next';

/** "ago" after a count of days or periods. */
export const AGO_WORD = 'ago';

/** Arabic words before a count of days or periods: "من تلات أيام", "قبل يومين". */
export const AGO_PREFIX_WORDS: ReadonlySet<string> = new Set(['من', 'قبل']);

/** Words for a day after a count, singular or plural. */
export const DAY_UNIT_WORDS: ReadonlySet<string> = new Set(['day', 'days', 'يوم', 'ايام', 'يوما']);

/** The Arabic dual "يومين": two days. */
export const TWO_DAYS_WORD = 'يومين';

/**
 * Periods other than a day, including duals ("اسبوعين"). Counted ("two weeks ago", "من
 * شهر"), after last or next, or before a marker ("الشهر اللي فات"), they are unsupported.
 */
export const PERIOD_WORDS: ReadonlySet<string> = new Set([
  'week',
  'weeks',
  'weekend',
  'month',
  'months',
  'year',
  'years',
  'night',
  'اسبوع',
  'اسابيع',
  'اسبوعين',
  'شهر',
  'شهور',
  'اشهر',
  'شهرين',
  'سنه',
  'سنين',
  'سنوات',
  'سنتين',
]);

/**
 * Month names. A calendar date is not supported in R1, so a month name is flagged and a day
 * number next to it is kept out of the amount. English "may" is left out: it is far more
 * often the verb.
 */
export const MONTH_WORDS: ReadonlySet<string> = new Set([
  'january',
  'february',
  'march',
  'april',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
  'يناير',
  'فبراير',
  'مارس',
  'ابريل',
  'مايو',
  'يونيو',
  'يونيه',
  'يوليو',
  'يوليه',
  'اغسطس',
  'سبتمبر',
  'اكتوبر',
  'نوفمبر',
  'ديسمبر',
]);

/** English ordinal endings split from a day number by `normalize` ("5th" -> "5", "th"). */
export const ORDINAL_SUFFIXES: ReadonlySet<string> = new Set(['st', 'nd', 'rd', 'th']);

/** Every word above: the vocabulary `normalize` protects and splits particles from. */
export const DATE_VOCABULARY: ReadonlySet<string> = new Set([
  ...RELATIVE_DAY_PHRASES.flatMap(({ words }) => words),
  ...FUTURE_PHRASES.flat(),
  ...Object.keys(WEEKDAY_WORDS),
  DAY_PREFIX,
  ...PAST_MARKERS.flat(),
  ...FUTURE_MARKERS.flat(),
  ...AGO_PREFIX_WORDS,
  ...DAY_UNIT_WORDS,
  TWO_DAYS_WORD,
  ...PERIOD_WORDS,
  ...MONTH_WORDS,
]);
