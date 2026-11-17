import { normalize } from './normalize.js';
import { readNumber } from './numbers.js';
import {
  AGO_PREFIX_WORDS,
  AGO_WORD,
  AMBIGUOUS_WEEKDAY_WORDS,
  DATE_VOCABULARY,
  DAY_PREFIX,
  DAY_UNIT_WORDS,
  FUTURE_MARKERS,
  FUTURE_PHRASES,
  LAST_WORD,
  MONTH_WORDS,
  NEXT_WORD,
  ORDINAL_SUFFIXES,
  PAST_MARKERS,
  PERIOD_WORDS,
  RELATIVE_DAY_PHRASES,
  TWO_DAYS_WORD,
  WEEKDAY_WORDS,
} from './lexicon/dates.js';
import { INDEFINITE_ARTICLE, NUMBER_VOCABULARY } from './lexicon/numbers.js';

/**
 * What a date expression means, independent of the day it is said on. `daysAgo` covers
 * today (0), yesterday (1), the day before yesterday (2) and "N days ago" for N from 1 to 30;
 * `weekday` is 0 for Sunday to 6 for Saturday. Anything the app recognises as a date but does
 * not support in R1, including N outside 1 to 30, is `unsupported`.
 */
export type DateExpression =
  | { readonly kind: 'daysAgo'; readonly days: number }
  | { readonly kind: 'lastWeekday'; readonly weekday: number }
  | { readonly kind: 'future' }
  | { readonly kind: 'unsupported' };

/** A date expression found in a token list; `end` is exclusive. */
export interface DateMatch {
  readonly start: number;
  readonly end: number;
  readonly expression: DateExpression;
}

/** The date an utterance gives, as `YYYY-MM-DD`, and whether it needs the user's attention. */
export interface ParsedDate {
  readonly date: string;
  readonly attention: boolean;
}

/** The longest supported count in "N days ago" (FR-027 notes). */
const MAX_DAYS_AGO = 30;

/** The vocabulary the convenience functions normalise with, so token positions agree. */
export const DATE_AND_NUMBER_VOCABULARY: ReadonlySet<string> = new Set([
  ...NUMBER_VOCABULARY,
  ...DATE_VOCABULARY,
]);

const UNSUPPORTED: DateExpression = { kind: 'unsupported' };
const FUTURE: DateExpression = { kind: 'future' };

const lookup = (record: Readonly<Record<string, number>>, token: string | undefined) =>
  token !== undefined && Object.hasOwn(record, token) ? record[token] : undefined;

/** The length of the first phrase found at `index`, longest first, or 0. */
function phraseAt(
  tokens: readonly string[],
  index: number,
  phrases: readonly (readonly string[])[],
): number {
  let longest = 0;
  for (const phrase of phrases) {
    if (phrase.length > longest && phrase.every((word, at) => tokens[index + at] === word)) {
      longest = phrase.length;
    }
  }
  return longest;
}

/** A number read at `index` as a count: its value when whole, NaN when it has a fraction. */
function readCount(tokens: readonly string[], index: number) {
  const number = readNumber(tokens, index);
  if (number === undefined) {
    return undefined;
  }
  const { units, places } = number.value;
  const whole = places === 0 ? Number(units) : Number.NaN;
  return { count: whole, end: number.end };
}

const daysAgo = (days: number): DateExpression =>
  Number.isInteger(days) && days >= 1 && days <= MAX_DAYS_AGO
    ? { kind: 'daysAgo', days }
    : UNSUPPORTED;

/** Today, yesterday, the day before yesterday and the future phrases, longest first. */
const FIXED_PHRASES: readonly {
  readonly words: readonly string[];
  readonly expression: DateExpression;
}[] = [
  ...RELATIVE_DAY_PHRASES.map(({ words, daysAgo: days }) => ({
    words,
    expression: { kind: 'daysAgo', days } as const,
  })),
  ...FUTURE_PHRASES.map((words) => ({ words, expression: FUTURE })),
].sort((a, b) => b.words.length - a.words.length);

/** "yesterday", "امبارح", "أول امبارح", "tomorrow", "بعد بكرة". */
function readFixedPhrase(tokens: readonly string[], start: number): DateMatch | undefined {
  const phrase = FIXED_PHRASES.find(({ words }) => phraseAt(tokens, start, [words]) > 0);
  return phrase && { start, end: start + phrase.words.length, expression: phrase.expression };
}

/** English: "three days ago", "a day ago", "two weeks ago". */
function readEnglishAgo(tokens: readonly string[], start: number): DateMatch | undefined {
  const counted =
    tokens[start] === INDEFINITE_ARTICLE ? { count: 1, end: start + 1 } : readCount(tokens, start);
  if (counted === undefined) {
    return undefined;
  }
  const unit = tokens[counted.end];
  if (tokens[counted.end + 1] !== AGO_WORD || unit === undefined) {
    return undefined;
  }
  const end = counted.end + 2;
  if (DAY_UNIT_WORDS.has(unit)) {
    return { start, end, expression: daysAgo(counted.count) };
  }
  return PERIOD_WORDS.has(unit) ? { start, end, expression: UNSUPPORTED } : undefined;
}

/** Arabic: "من تلات أيام", "قبل يومين", "من يوم واحد", "من اسبوع", "من تلات شهور". */
function readArabicAgo(tokens: readonly string[], start: number): DateMatch | undefined {
  const prefix = tokens[start];
  if (prefix === undefined || !AGO_PREFIX_WORDS.has(prefix)) {
    return undefined;
  }
  const at = start + 1;
  const word = tokens[at];
  if (word === undefined) {
    return undefined;
  }
  if (word === TWO_DAYS_WORD) {
    return { start, end: at + 1, expression: daysAgo(2) };
  }
  if (PERIOD_WORDS.has(word)) {
    return { start, end: at + 1, expression: UNSUPPORTED };
  }
  // The noun before the number, as in "يوم واحد".
  if (DAY_UNIT_WORDS.has(word)) {
    const after = readCount(tokens, at + 1);
    return after?.count === 1 ? { start, end: after.end, expression: daysAgo(1) } : undefined;
  }
  const counted = readCount(tokens, at);
  const unit = counted === undefined ? undefined : tokens[counted.end];
  if (counted === undefined || unit === undefined) {
    return undefined;
  }
  if (DAY_UNIT_WORDS.has(unit)) {
    return { start, end: counted.end + 1, expression: daysAgo(counted.count) };
  }
  return PERIOD_WORDS.has(unit)
    ? { start, end: counted.end + 1, expression: UNSUPPORTED }
    : undefined;
}

/** English "last friday", "next friday", "last week", "next month". */
function readLastOrNext(tokens: readonly string[], start: number): DateMatch | undefined {
  const word = tokens[start];
  if (word !== LAST_WORD && word !== NEXT_WORD) {
    return undefined;
  }
  const target = tokens[start + 1];
  const weekday = lookup(WEEKDAY_WORDS, target);
  const end = start + 2;
  if (weekday !== undefined) {
    return {
      start,
      end,
      expression: word === LAST_WORD ? { kind: 'lastWeekday', weekday } : FUTURE,
    };
  }
  if (target !== undefined && PERIOD_WORDS.has(target)) {
    return { start, end, expression: word === LAST_WORD ? UNSUPPORTED : FUTURE };
  }
  return undefined;
}

/**
 * A weekday name, optionally after "يوم", optionally before "اللي فات"/"الماضي" (the most
 * recent one before today) or "الجاي" (future). A weekday with neither is ambiguous and is
 * flagged; one that is also a number or a common word needs "يوم" or a marker to count.
 */
function readWeekday(tokens: readonly string[], start: number): DateMatch | undefined {
  const prefixed = tokens[start] === DAY_PREFIX;
  const at = prefixed ? start + 1 : start;
  const name = tokens[at];
  const weekday = lookup(WEEKDAY_WORDS, name);
  if (name === undefined || weekday === undefined) {
    return undefined;
  }
  const past = phraseAt(tokens, at + 1, PAST_MARKERS);
  if (past > 0) {
    return { start, end: at + 1 + past, expression: { kind: 'lastWeekday', weekday } };
  }
  const future = phraseAt(tokens, at + 1, FUTURE_MARKERS);
  if (future > 0) {
    return { start, end: at + 1 + future, expression: FUTURE };
  }
  if (prefixed || !AMBIGUOUS_WEEKDAY_WORDS.has(name)) {
    return { start, end: at + 1, expression: UNSUPPORTED };
  }
  return undefined;
}

/** Arabic "الشهر اللي فات", "الأسبوع الماضي", "الشهر الجاي". */
function readMarkedPeriod(tokens: readonly string[], start: number): DateMatch | undefined {
  const word = tokens[start];
  if (word === undefined || !PERIOD_WORDS.has(word)) {
    return undefined;
  }
  const past = phraseAt(tokens, start + 1, PAST_MARKERS);
  if (past > 0) {
    return { start, end: start + 1 + past, expression: UNSUPPORTED };
  }
  const future = phraseAt(tokens, start + 1, FUTURE_MARKERS);
  return future > 0 ? { start, end: start + 1 + future, expression: FUTURE } : undefined;
}

const isDayOfMonth = (counted: { count: number } | undefined) =>
  counted !== undefined &&
  Number.isInteger(counted.count) &&
  counted.count >= 1 &&
  counted.count <= 31;

/** "5 november", "november 5th", "١٠ نوفمبر": a day number then a month name, or the reverse. */
function readCalendarDate(tokens: readonly string[], start: number): DateMatch | undefined {
  const before = readCount(tokens, start);
  if (before !== undefined && isDayOfMonth(before) && MONTH_WORDS.has(tokens[before.end] ?? '')) {
    return { start, end: before.end + 1, expression: UNSUPPORTED };
  }
  if (!MONTH_WORDS.has(tokens[start] ?? '')) {
    return undefined;
  }
  const after = readCount(tokens, start + 1);
  if (after === undefined || !isDayOfMonth(after)) {
    return { start, end: start + 1, expression: UNSUPPORTED };
  }
  const end = ORDINAL_SUFFIXES.has(tokens[after.end] ?? '') ? after.end + 1 : after.end;
  return { start, end, expression: UNSUPPORTED };
}

const READERS = [
  readFixedPhrase,
  readArabicAgo,
  readEnglishAgo,
  readLastOrNext,
  readWeekday,
  readMarkedPeriod,
  readCalendarDate,
];

/**
 * Finds the date expressions in normalised tokens (ADR 0003 step 3), left to right, without
 * overlaps. Pass the spans to `findAmounts` so that a number inside a date expression ("من
 * تلات أيام") cannot become the amount. Tokens must come from `normalize` with a vocabulary
 * that includes `DATE_VOCABULARY`.
 */
export function findDates(tokens: readonly string[]): DateMatch[] {
  const matches: DateMatch[] = [];
  for (let index = 0; index < tokens.length;) {
    let found: DateMatch | undefined;
    for (const read of READERS) {
      found = read(tokens, index);
      if (found !== undefined) {
        break;
      }
    }
    if (found === undefined) {
      index += 1;
    } else {
      matches.push(found);
      index = found.end;
    }
  }
  return matches;
}

// Calendar arithmetic on day numbers counted from 1970-01-01, with no Date object and no time
// zone (H. Hinnant, "chrono-compatible low-level date algorithms").

const ISO_DATE = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function toDayNumber(year: number, month: number, day: number): number {
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yearOfEra = y - era * 400;
  const dayOfYear = Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1;
  const dayOfEra =
    yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
  return era * 146097 + dayOfEra - 719468;
}

function fromDayNumber(dayNumber: number): string {
  const z = dayNumber + 719468;
  const era = Math.floor(z / 146097);
  const dayOfEra = z - era * 146097;
  const yearOfEra = Math.floor(
    (dayOfEra -
      Math.floor(dayOfEra / 1460) +
      Math.floor(dayOfEra / 36524) -
      Math.floor(dayOfEra / 146096)) /
      365,
  );
  const dayOfYear =
    dayOfEra - (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const shiftedMonth = Math.floor((5 * dayOfYear + 2) / 153);
  const day = dayOfYear - Math.floor((153 * shiftedMonth + 2) / 5) + 1;
  const month = shiftedMonth < 10 ? shiftedMonth + 3 : shiftedMonth - 9;
  const year = yearOfEra + era * 400 + (month <= 2 ? 1 : 0);
  const pad = (value: number, width: number) => String(value).padStart(width, '0');
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

/** Reads an injected "today"; a malformed or impossible date is a programming error. */
function readToday(today: string): number {
  const parts = ISO_DATE.exec(today);
  const [year, month, day] = (parts?.slice(1) ?? []).map(Number);
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month)
  ) {
    throw new RangeError(`today must be a calendar date written YYYY-MM-DD, got "${today}"`);
  }
  return toDayNumber(year, month, day);
}

/** 0 for Sunday to 6 for Saturday; day 0 (1970-01-01) was a Thursday. */
const weekdayOf = (dayNumber: number) => (((dayNumber + 4) % 7) + 7) % 7;

function daysBefore(expression: DateExpression, todayNumber: number): number | undefined {
  switch (expression.kind) {
    case 'daysAgo':
      return expression.days;
    case 'lastWeekday':
      // The most recent such weekday before today: 7 days back when today is that weekday.
      return (weekdayOf(todayNumber) - expression.weekday + 7) % 7 || 7;
    default:
      return undefined;
  }
}

/**
 * The date that the expressions found in an utterance give, counted back from `today` (the
 * device's local calendar date, `YYYY-MM-DD`). No expression gives today, unflagged (FR-027
 * criterion 1). A future or unsupported expression, or two expressions that give different
 * dates, give today flagged for attention (criterion 6).
 */
export function resolveDate(matches: readonly DateMatch[], today: string): ParsedDate {
  const todayNumber = readToday(today);
  const offsets = new Set(matches.map(({ expression }) => daysBefore(expression, todayNumber)));
  const [offset] = offsets;
  if (offsets.size !== 1 || offset === undefined) {
    return { date: today, attention: offsets.size > 0 };
  }
  return { date: fromDayNumber(todayNumber - offset), attention: false };
}

/** The date of a transcript, counted back from `today` (`YYYY-MM-DD`). */
export function parseDate(text: string, today: string): ParsedDate {
  return resolveDate(findDates(normalize(text, DATE_AND_NUMBER_VOCABULARY)), today);
}
