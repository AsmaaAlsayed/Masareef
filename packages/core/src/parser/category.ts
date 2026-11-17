import type { CategoryCode } from '../categories.js';
import { CURRENCY_VOCABULARY } from './lexicon/currencies.js';
import { CATEGORY_KEYWORDS } from './lexicon/categories.js';
import { DATE_VOCABULARY } from './lexicon/dates.js';
import { NUMBER_VOCABULARY } from './lexicon/numbers.js';

/**
 * A category keyword found in a token list; `end` is exclusive. `fuzzy` is true when the
 * token matched a keyword at edit distance one rather than exactly.
 */
export interface CategoryMatch {
  readonly start: number;
  readonly end: number;
  readonly category: CategoryCode;
  readonly fuzzy: boolean;
}

/** The category of an utterance and whether it needs the user's attention. */
export interface ParsedCategory {
  readonly category: CategoryCode;
  readonly attention: boolean;
}

/** Fuzzy matching applies only to tokens, and keywords, of at least this many letters. */
const FUZZY_MIN_LETTERS = 5;

interface Keyword {
  readonly words: readonly string[];
  readonly category: CategoryCode;
}

const KEYWORDS: readonly Keyword[] = Object.entries(CATEGORY_KEYWORDS).flatMap(
  ([category, keywords]) =>
    keywords.map((keyword) => ({ words: keyword.split(' '), category: category as CategoryCode })),
);

const KEYWORDS_BY_FIRST_WORD = new Map<string, Keyword[]>();
for (const keyword of KEYWORDS) {
  const [first = ''] = keyword.words;
  KEYWORDS_BY_FIRST_WORD.set(first, [...(KEYWORDS_BY_FIRST_WORD.get(first) ?? []), keyword]);
}

const letterCount = (word: string) => (/^\p{L}+$/u.test(word) ? [...word].length : 0);

/** Single-word keywords long enough to be matched fuzzily. */
const FUZZY_KEYWORDS = KEYWORDS.filter(
  ({ words }) => words.length === 1 && letterCount(words[0] ?? '') >= FUZZY_MIN_LETTERS,
);

/** Number, date and currency words are never read as a misspelt category word. */
const OTHER_STAGE_WORDS: ReadonlySet<string> = new Set([
  ...NUMBER_VOCABULARY,
  ...DATE_VOCABULARY,
  ...CURRENCY_VOCABULARY,
]);

/**
 * Every word of every category keyword: the vocabulary `normalize` protects and splits
 * particles from ("للتاكسي" -> "ل" + "تاكسي").
 */
export const CATEGORY_VOCABULARY: ReadonlySet<string> = new Set(
  KEYWORDS.flatMap(({ words }) => words),
);

/** True when `a` and `b` differ by at most one insertion, deletion or substitution. */
function withinOneEdit(a: string, b: string): boolean {
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  if (longer.length - shorter.length > 1) {
    return false;
  }
  let i = 0;
  while (i < shorter.length && shorter[i] === longer[i]) {
    i += 1;
  }
  const skip = shorter.length === longer.length ? 1 : 0;
  return shorter.slice(i + skip) === longer.slice(i + 1);
}

function exactAt(tokens: readonly string[], index: number): Keyword | undefined {
  let longest: Keyword | undefined;
  for (const keyword of KEYWORDS_BY_FIRST_WORD.get(tokens[index] ?? '') ?? []) {
    const matches = keyword.words.every((word, offset) => tokens[index + offset] === word);
    if (matches && keyword.words.length > (longest?.words.length ?? 0)) {
      longest = keyword;
    }
  }
  return longest;
}

function fuzzyAt(token: string): Keyword | undefined {
  if (letterCount(token) < FUZZY_MIN_LETTERS || OTHER_STAGE_WORDS.has(token)) {
    return undefined;
  }
  return FUZZY_KEYWORDS.find(({ words: [word = ''] }) => withinOneEdit(token, word));
}

/**
 * Finds the category keywords in normalised tokens (ADR 0003 step 6), left to right, without
 * overlaps, longest keyword first ("سوبر ماركت" as one match). A token of five or more
 * letters that matches no keyword exactly also matches a keyword of five or more letters at
 * edit distance one, to absorb the recogniser's spelling variation; number, date and currency
 * words are never matched that way. Tokens must come from `normalize` with a vocabulary that
 * includes `CATEGORY_VOCABULARY`.
 */
export function findCategories(tokens: readonly string[]): CategoryMatch[] {
  const matches: CategoryMatch[] = [];
  for (let index = 0; index < tokens.length;) {
    const exact = exactAt(tokens, index);
    if (exact !== undefined) {
      const end = index + exact.words.length;
      matches.push({ start: index, end, category: exact.category, fuzzy: false });
      index = end;
      continue;
    }
    const fuzzy = fuzzyAt(tokens[index] ?? '');
    if (fuzzy !== undefined) {
      matches.push({ start: index, end: index + 1, category: fuzzy.category, fuzzy: true });
    }
    index += 1;
  }
  return matches;
}

/**
 * Chooses the category from the matches of `findCategories`. Exact matches win: fuzzy ones
 * count only when there is no exact match. When the counted matches name one category it is
 * used, unflagged; when they name several, the first said is used and flagged. No match gives
 * Other, flagged (FR-026 criterion 3).
 */
export function resolveCategory(matches: readonly CategoryMatch[]): ParsedCategory {
  const exact = matches.filter(({ fuzzy }) => !fuzzy);
  const counted = exact.length > 0 ? exact : matches;
  const [first] = counted;
  if (first === undefined) {
    return { category: 'other', attention: true };
  }
  const categories = new Set(counted.map(({ category }) => category));
  return { category: first.category, attention: categories.size > 1 };
}
