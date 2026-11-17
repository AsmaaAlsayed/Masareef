import type { CategoryCode } from '../categories.js';
import { isCurrencyCode, type CurrencyCode } from '../currencies.js';
import type { Language } from '../language.js';
import { findAmounts } from './amount.js';
import { CATEGORY_VOCABULARY, findCategories, resolveCategory } from './category.js';
import { findCurrencies, resolveMoney } from './currency.js';
import { findDates, resolveDate } from './dates.js';
import { CURRENCY_VOCABULARY } from './lexicon/currencies.js';
import { DATE_VOCABULARY } from './lexicon/dates.js';
import { NUMBER_VOCABULARY } from './lexicon/numbers.js';
import { normalize } from './normalize.js';

/**
 * How to read one utterance. `language` is the language the recogniser was told (`ar` or
 * `en`); the parser reads Arabic and English words in either mode, because users mix them
 * (FR-029). `defaultCurrency` is the user's default currency (FR-028 criterion 1). `today` is
 * the device's local calendar date, `YYYY-MM-DD` (FR-027).
 */
export interface UtteranceOptions {
  readonly language: Language;
  readonly defaultCurrency: CurrencyCode;
  readonly today: string;
}

/**
 * What an utterance gives the review screen (architecture C4). `amount` is exact decimal text
 * in major units ("50", "0.75"), never rounded or clamped (FR-025 criterion 8), and absent
 * when none was understood. `attention` marks each field the user must check (FR-024
 * criterion 5). `text` is the transcript exactly as recognised, for display only.
 */
export interface ParsedUtterance {
  readonly amount?: string;
  readonly currency: CurrencyCode;
  readonly category: CategoryCode;
  readonly date: string;
  readonly attention: {
    readonly amount: boolean;
    readonly currency: boolean;
    readonly category: boolean;
    readonly date: boolean;
  };
  readonly text: string;
}

const LANGUAGES: readonly Language[] = ['ar', 'en'];

/** The vocabulary `parseUtterance` normalises with: number, date, currency and category words. */
export const UTTERANCE_VOCABULARY: ReadonlySet<string> = new Set([
  ...NUMBER_VOCABULARY,
  ...DATE_VOCABULARY,
  ...CURRENCY_VOCABULARY,
  ...CATEGORY_VOCABULARY,
]);

// Arabic words, Latin words, and words in any other script. Digits are not words.
const WORD =
  /((?:(?=\p{L})\p{Script=Arabic})+)|((?:(?=\p{L})\p{Script=Latin})+)|((?:(?![\p{Script=Arabic}\p{Script=Latin}])\p{L})+)/gu;
const ENGLISH_LETTERS = /^[a-z]+$/i;

/**
 * True when most words of `text` are in a language other than Arabic or English (FR-029
 * criterion 5): more than half of its words are in a script other than Arabic or Latin, or
 * are Latin words with letters outside a to z ("déjeuner"). Combining marks and tatweel are
 * removed first, so they neither split nor form words.
 */
function isMostlyOtherLanguage(text: string): boolean {
  const cleaned = text.normalize('NFKC').replace(/[\p{M}ـ]/gu, '');
  let arabicOrEnglish = 0;
  let other = 0;
  for (const [, arabic, latin] of cleaned.matchAll(WORD)) {
    if (arabic !== undefined || (latin !== undefined && ENGLISH_LETTERS.test(latin))) {
      arabicOrEnglish += 1;
    } else {
      other += 1;
    }
  }
  return other > arabicOrEnglish;
}

function checkOptions({ language, defaultCurrency, today }: UtteranceOptions): void {
  if (!LANGUAGES.includes(language)) {
    throw new RangeError(`language must be one of ${LANGUAGES.join(', ')}`);
  }
  if (!isCurrencyCode(defaultCurrency)) {
    throw new RangeError(`defaultCurrency must be a supported currency code`);
  }
  // Throws on a malformed or impossible date.
  resolveDate([], today);
}

/**
 * Reads amount, currency, category and date from one transcript (ADR 0003) and marks the
 * fields the user must check. It returns data only: it never saves, sends or stores anything
 * (NFR-008); the review screen's Save is the only way to store a voice expense.
 *
 * - Amount and currency: `resolveMoney` (FR-025, FR-028); numbers inside date expressions
 *   are not amounts.
 * - Date: `resolveDate` (FR-027); no date expression gives today, unflagged.
 * - Category: `resolveCategory` (FR-026); no category word gives Other, flagged.
 * - Nothing understood (no amount, category or date): amount empty, Other and today, each
 *   flagged (FR-030 criterion 1).
 * - Mostly another language: the same, with the currency also flagged and nothing taken from
 *   the text (FR-029 criterion 5).
 *
 * Invalid options are programming errors and throw a `RangeError`.
 */
export function parseUtterance(text: string, options: UtteranceOptions): ParsedUtterance {
  checkOptions(options);
  const { defaultCurrency, today } = options;
  if (isMostlyOtherLanguage(text)) {
    return {
      currency: defaultCurrency,
      category: 'other',
      date: today,
      attention: { amount: true, currency: true, category: true, date: true },
      text,
    };
  }
  const tokens = normalize(text, UTTERANCE_VOCABULARY);
  const dates = findDates(tokens);
  const money = resolveMoney(findAmounts(tokens, dates), findCurrencies(tokens), defaultCurrency);
  const date = resolveDate(dates, today);
  const categories = findCategories(tokens);
  const category = resolveCategory(categories);
  const nothingUnderstood =
    money.amount === undefined && categories.length === 0 && dates.length === 0;
  const result = {
    currency: money.currency,
    category: category.category,
    date: date.date,
    attention: {
      amount: money.attention.amount,
      currency: money.attention.currency,
      category: category.attention,
      date: date.attention || nothingUnderstood,
    },
    text,
  };
  return money.amount === undefined ? result : { amount: money.amount, ...result };
}
