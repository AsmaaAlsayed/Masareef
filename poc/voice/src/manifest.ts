import {
  getCurrency,
  isCategoryCode,
  isCurrencyCode,
  toMinor,
  type CategoryCode,
  type CurrencyCode,
  type Language,
} from '@masareef/core';

/**
 * Voice test-set manifests (T-007). One manifest per language holds the scripted sentences and
 * what a person means by each: amount, currency, category and date, against a fixed "today"
 * stored in the manifest. Audio is not in the repository (docs/04-plan.md, PQ-04); a later task
 * adds per-sentence `audio` references with checksums, which are optional here.
 */

/**
 * What each tag says about a sentence. The first three are the NFR-001 mix. The tags up to
 * `digits` are checked against the text or the expected values; the others are descriptive.
 */
export const TAGS = [
  'mixed', // Arabic sentence with English words in Latin letters (FR-029 c4)
  'piastres_or_fraction', // a piastre or fraction word, or a fractional amount
  'relative_date', // the expected date is not today
  'foreign_currency', // the expected currency is not the default
  'no_category', // no category word, so the expected category is other
  'digits', // the transcript has digits in some script
  'quantity', // a count or weight next to the price ("تلاتة سندوتشات", "half a kilo")
  'multiple_numbers', // another number besides the amount (a time, a unit price)
  'filler', // hesitations and hedges ("يعني", "حوالي", "umm")
  'transliterated', // an English word or brand in Arabic script ("اوبر")
  'standard_arabic', // Standard Arabic spelling, as a recogniser may write it
  'bare_weekday', // a weekday without "last"
] as const;

export type Tag = (typeof TAGS)[number];

export interface ExpectedFields {
  /** Decimal text with exactly the currency's decimal places ("50.00", "1.250" for KWD). */
  readonly amount: string;
  readonly currency: CurrencyCode;
  readonly category: CategoryCode;
  /** Calendar date, YYYY-MM-DD, on or before the manifest's `today`. */
  readonly date: string;
}

export interface AudioReference {
  readonly file: string;
  readonly sha256: string;
}

export interface Utterance {
  readonly id: string;
  readonly text: string;
  readonly tags: readonly Tag[];
  readonly expected: ExpectedFields;
  readonly note?: string;
  readonly audio?: readonly AudioReference[];
}

export interface DroppedSentence {
  readonly text: string;
  readonly reason: string;
}

export interface Manifest {
  readonly schemaVersion: 1;
  readonly language: Language;
  readonly locale: string;
  readonly status: string;
  readonly statusNote?: string;
  readonly today: string;
  readonly defaultCurrency: CurrencyCode;
  readonly utterances: readonly Utterance[];
  /** Sentences removed before scoring because their correct answer is unclear. */
  readonly dropped: readonly DroppedSentence[];
}

interface Composition {
  readonly total: number;
  readonly tags: Readonly<Partial<Record<Tag, number>>>;
}

/** The minimum test-set composition: NFR-001 for Egyptian Arabic, NFR-003 for English. */
export const COMPOSITION: Readonly<Record<Language, Composition>> = {
  ar: { total: 100, tags: { mixed: 20, piastres_or_fraction: 10, relative_date: 15 } },
  en: { total: 100, tags: {} },
};

export type ValidationResult =
  | { readonly ok: true; readonly manifest: Manifest }
  | { readonly ok: false; readonly errors: readonly string[] };

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ARABIC_LETTER = /[ء-ي]/;
const LATIN_LETTER = /[A-Za-z]/;
const DIGIT = /[0-9٠-٩۰-۹]/;
// The validator's own short list, independent of the parser's lexicon.
const FRACTION_WORD =
  /(?:^|[\s،,])[وبل]?(?:نص|نصف|ربع|تلت|ثلث|قرش|قروش)(?=$|[\s،,.])|\b(?:half|quarter|third|piastres?)\b/i;
const SHA256 = /^[0-9a-f]{64}$/;
const FILE_NAME = /^[\w.-]+$/;

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = DATE.exec(value);
  if (match === null) return false;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toISOString().slice(0, 10) === value;
}

const hasFractionalPart = (amount: string): boolean => /[1-9]/.test(amount.split('.')[1] ?? '');

interface Context {
  readonly language: Language | undefined;
  readonly today: string | undefined;
  readonly defaultCurrency: CurrencyCode | undefined;
  readonly ids: Set<string>;
  readonly texts: Map<string, string>;
  readonly errors: string[];
}

function checkId(entry: Json, label: string, context: Context): void {
  const prefix = context.language ?? 'ar';
  const id = entry.id;
  if (typeof id !== 'string' || !new RegExp(`^${prefix}-\\d{3}$`).test(id)) {
    context.errors.push(`${label}: id must look like ${prefix}-001`);
  } else if (context.ids.has(id)) {
    context.errors.push(`${label}: duplicate id`);
  } else {
    context.ids.add(id);
  }
}

function checkText(entry: Json, label: string, context: Context): string {
  if (!isText(entry.text)) {
    context.errors.push(`${label}: text must be a non-empty string`);
    return '';
  }
  const first = context.texts.get(entry.text);
  if (first === undefined) {
    context.texts.set(entry.text, label);
  } else {
    context.errors.push(`${label}: duplicate text (same as ${first})`);
  }
  return entry.text;
}

function readTags(entry: Json, label: string, context: Context): readonly Tag[] {
  if (!Array.isArray(entry.tags)) {
    context.errors.push(`${label}: tags must be an array`);
    return [];
  }
  const tags = new Set<Tag>();
  for (const tag of entry.tags as unknown[]) {
    if ((TAGS as readonly unknown[]).includes(tag)) {
      tags.add(tag as Tag);
    } else {
      context.errors.push(`${label}: unknown tag ${JSON.stringify(tag)}`);
    }
  }
  return [...tags];
}

function checkExpected(expected: Json, label: string, context: Context): void {
  const { amount, currency, category, date } = expected;
  if (isCurrencyCode(currency)) {
    const { decimals } = getCurrency(currency);
    if (typeof amount !== 'string' || !new RegExp(`^\\d+\\.\\d{${decimals}}$`).test(amount)) {
      context.errors.push(
        `${label}: expected.amount ${JSON.stringify(amount)} must be a decimal with exactly ${decimals} decimal places for ${currency}`,
      );
    } else {
      const minor = toMinor(amount, currency);
      if (!minor.ok) {
        context.errors.push(
          `${label}: expected.amount "${amount}" is not a valid amount (${minor.reason})`,
        );
      }
    }
  } else {
    context.errors.push(`${label}: expected.currency must be one of the currency codes`);
  }
  if (!isCategoryCode(category)) {
    context.errors.push(`${label}: expected.category must be one of the category codes`);
  }
  if (!isCalendarDate(date)) {
    context.errors.push(`${label}: expected.date must be a calendar date YYYY-MM-DD`);
  } else if (context.today !== undefined && date > context.today) {
    context.errors.push(`${label}: expected.date ${date} is after today (${context.today})`);
  }
}

/** A checked tag must agree with the text or the expected values, both ways where possible. */
function checkTags(
  text: string,
  tags: readonly Tag[],
  expected: Json,
  label: string,
  context: Context,
): void {
  const errors = context.errors;
  const has = (tag: Tag) => tags.includes(tag);
  const both = (tag: Tag, actual: boolean, whenTagged: string, whenNotTagged: string) => {
    if (has(tag) && !actual) errors.push(`${label}: ${whenTagged}`);
    if (!has(tag) && actual) errors.push(`${label}: ${whenNotTagged}`);
  };

  if (has('mixed') && !(ARABIC_LETTER.test(text) && LATIN_LETTER.test(text))) {
    errors.push(
      `${label}: tagged mixed but the text does not contain both Arabic and Latin letters`,
    );
  }
  const fractional = typeof expected.amount === 'string' && hasFractionalPart(expected.amount);
  if (has('piastres_or_fraction') && !FRACTION_WORD.test(text) && !fractional) {
    errors.push(
      `${label}: tagged piastres_or_fraction but has no fraction or piastre word and a whole amount`,
    );
  }
  if (
    isCalendarDate(expected.date) &&
    context.today !== undefined &&
    expected.date <= context.today
  ) {
    both(
      'relative_date',
      expected.date !== context.today,
      'tagged relative_date but the expected date is today',
      'expected date is not today but the sentence is not tagged relative_date',
    );
  }
  if (isCurrencyCode(expected.currency) && context.defaultCurrency !== undefined) {
    both(
      'foreign_currency',
      expected.currency !== context.defaultCurrency,
      'tagged foreign_currency but the expected currency is the default',
      'expected currency is not the default but not tagged foreign_currency',
    );
  }
  if (isCategoryCode(expected.category)) {
    both(
      'no_category',
      expected.category === 'other',
      'tagged no_category but the expected category is not other',
      'expected category is other but not tagged no_category',
    );
  }
  both(
    'digits',
    DIGIT.test(text),
    'tagged digits but the text has no digit',
    'the text has a digit but is not tagged digits',
  );
}

function checkAudio(audio: unknown, label: string, context: Context): void {
  if (audio === undefined) return;
  if (!Array.isArray(audio)) {
    context.errors.push(`${label}: audio must be an array`);
    return;
  }
  audio.forEach((entry: unknown, index) => {
    const valid =
      isObject(entry) &&
      typeof entry.file === 'string' &&
      FILE_NAME.test(entry.file) &&
      typeof entry.sha256 === 'string' &&
      SHA256.test(entry.sha256);
    if (!valid) {
      context.errors.push(
        `${label}: audio[${index}] needs a file name and a lower-case hex sha256`,
      );
    }
  });
}

/** Checks one utterance and returns its valid tags, for the composition count. */
function checkUtterance(entry: unknown, index: number, context: Context): readonly Tag[] {
  if (!isObject(entry)) {
    context.errors.push(`utterances[${index}] must be an object`);
    return [];
  }
  const label = typeof entry.id === 'string' ? entry.id : `utterances[${index}]`;
  checkId(entry, label, context);
  const text = checkText(entry, label, context);
  const tags = readTags(entry, label, context);
  const expected = isObject(entry.expected) ? entry.expected : {};
  checkExpected(expected, label, context);
  if (text !== '') checkTags(text, tags, expected, label, context);
  if (entry.note !== undefined && typeof entry.note !== 'string') {
    context.errors.push(`${label}: note must be a string`);
  }
  checkAudio(entry.audio, label, context);
  return tags;
}

/**
 * Validates a parsed manifest file: header fields, every utterance, plausible tags, unique ids
 * and texts, and the minimum composition for its language. Errors are returned, not thrown,
 * so one run lists everything that needs fixing.
 */
export function validateManifest(input: unknown): ValidationResult {
  if (!isObject(input)) {
    return { ok: false, errors: ['manifest must be an object'] };
  }
  const errors: string[] = [];
  if (input.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  const language = input.language === 'ar' || input.language === 'en' ? input.language : undefined;
  if (language === undefined) errors.push('language must be "ar" or "en"');
  const today = isCalendarDate(input.today) ? input.today : undefined;
  if (today === undefined) errors.push('today must be a calendar date YYYY-MM-DD');
  const defaultCurrency = isCurrencyCode(input.defaultCurrency) ? input.defaultCurrency : undefined;
  if (defaultCurrency === undefined) {
    errors.push('defaultCurrency must be one of the currency codes');
  }
  if (!isText(input.status)) errors.push('status must be a non-empty string');
  if (!isText(input.locale)) errors.push('locale must be a non-empty string');
  if (Array.isArray(input.dropped)) {
    input.dropped.forEach((entry: unknown, index) => {
      if (!isObject(entry) || !isText(entry.text) || !isText(entry.reason)) {
        errors.push(`dropped[${index}] needs a non-empty text and reason`);
      }
    });
  } else {
    errors.push('dropped must be an array');
  }
  if (!Array.isArray(input.utterances)) {
    errors.push('utterances must be an array');
    return { ok: false, errors };
  }

  const context: Context = {
    language,
    today,
    defaultCurrency,
    ids: new Set(),
    texts: new Map(),
    errors,
  };
  const counts = new Map<Tag, number>();
  input.utterances.forEach((entry: unknown, index) => {
    for (const tag of checkUtterance(entry, index, context)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  });

  if (language !== undefined) {
    const minimum = COMPOSITION[language];
    const total = input.utterances.length;
    if (total < minimum.total) {
      errors.push(`composition: ${total} utterances, at least ${minimum.total} required`);
    }
    for (const [tag, required] of Object.entries(minimum.tags) as [Tag, number][]) {
      const count = counts.get(tag) ?? 0;
      if (count < required) {
        errors.push(
          `composition: ${count} utterances tagged ${tag}, at least ${required} required`,
        );
      }
    }
  }

  return errors.length === 0
    ? { ok: true, manifest: input as unknown as Manifest }
    : { ok: false, errors };
}

/** One line per manifest: the total and the count for every tag in use, in tag order. */
export function describeComposition(manifest: Manifest): string {
  const parts = TAGS.map(
    (tag) => [tag, manifest.utterances.filter((entry) => entry.tags.includes(tag)).length] as const,
  )
    .filter(([, count]) => count > 0)
    .map(([tag, count]) => `${tag} ${count}`);
  return `${manifest.language}: ${manifest.utterances.length} utterances; ${parts.join(', ')}`;
}
