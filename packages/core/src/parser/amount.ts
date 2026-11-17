import { add, decimal, hundredths, toDecimalString, type Decimal } from './decimal.js';
import {
  CONJUNCTION_WORDS,
  FRACTION_WORDS,
  INDEFINITE_ARTICLE,
  PIASTRE_WORDS,
} from './lexicon/numbers.js';
import { CURRENCY_VOCABULARY, UNIT_WORDS } from './lexicon/currencies.js';
import { DATE_AND_NUMBER_VOCABULARY, findDates } from './dates.js';
import { normalize } from './normalize.js';
import { readNumber } from './numbers.js';

/**
 * An amount found in a token list. `amount` is exact decimal text in major units ("50",
 * "5.5", "0.75") as `toMinor` reads it; it is never rounded or clamped, because limits and
 * precision are checked by the form on Save (FR-025 criterion 8). `impliedCurrency` is EGP
 * when the amount was said in piastres. `end` is exclusive.
 */
export interface AmountMatch {
  readonly amount: string;
  readonly start: number;
  readonly end: number;
  readonly impliedCurrency?: 'EGP';
}

/** A range of tokens, such as a date expression, that no amount may use; `end` is exclusive. */
export interface TokenSpan {
  readonly start: number;
  readonly end: number;
}

interface Piece {
  readonly value: Decimal;
  readonly end: number;
  readonly piastres: boolean;
}

/** The vocabulary the convenience functions normalise with, so token positions agree. */
export const AMOUNT_VOCABULARY: ReadonlySet<string> = new Set([
  ...DATE_AND_NUMBER_VOCABULARY,
  ...CURRENCY_VOCABULARY,
]);

const lookup = <Value>(record: Readonly<Record<string, Value>>, token: string | undefined) =>
  token !== undefined && Object.hasOwn(record, token) ? record[token] : undefined;

/** Skips "و"/"and" at `index` when one is there. */
const afterConjunction = (tokens: readonly string[], index: number, required: boolean) => {
  const token = tokens[index];
  if (token !== undefined && CONJUNCTION_WORDS.has(token)) {
    return index + 1;
  }
  return required ? undefined : index;
};

/** "ونص", "and a half", "وربع": a fraction joined by a conjunction. */
function readFraction(tokens: readonly string[], index: number): Piece | undefined {
  let at = afterConjunction(tokens, index, true);
  if (at === undefined) {
    return undefined;
  }
  if (tokens[at] === INDEFINITE_ARTICLE) {
    at += 1;
  }
  const hundredthsOfUnit = lookup(FRACTION_WORDS, tokens[at]);
  if (hundredthsOfUnit === undefined) {
    return undefined;
  }
  return { value: decimal(hundredthsOfUnit, 2), end: at + 1, piastres: false };
}

/** "وخمسين قرش", "and fifty piastres", "50 piastres", "قرشين": a number of piastres. */
function readPiastres(tokens: readonly string[], index: number): Piece | undefined {
  const dual = lookup(PIASTRE_WORDS, tokens[index]);
  if (dual === 2) {
    return { value: decimal(2, 2), end: index + 1, piastres: true };
  }
  const number = readNumber(tokens, index);
  if (number === undefined || lookup(PIASTRE_WORDS, tokens[number.end]) === undefined) {
    return undefined;
  }
  return { value: hundredths(number.value), end: number.end + 1, piastres: true };
}

/**
 * What may follow a currency word: a fraction ("دولار ونص"), and after pounds only, piastres
 * with or without a conjunction.
 */
function readUnitTail(tokens: readonly string[], index: number, pound: boolean): Piece | undefined {
  const fraction = readFraction(tokens, index);
  if (fraction !== undefined || !pound) {
    return fraction;
  }
  const at = afterConjunction(tokens, index, false) ?? index;
  return readPiastres(tokens, at);
}

const withTail = (head: Piece, tail: Piece | undefined): Piece =>
  tail === undefined
    ? head
    : {
        value: add(head.value, tail.value),
        end: tail.end,
        piastres: head.piastres || tail.piastres,
      };

/** A number, then optionally a currency word, a fraction or piastres. */
function readNumberAmount(tokens: readonly string[], start: number): Piece | undefined {
  const piastres = readPiastres(tokens, start);
  if (piastres !== undefined) {
    return piastres;
  }
  const number = readNumber(tokens, start);
  if (number === undefined) {
    return undefined;
  }
  const head: Piece = { value: number.value, end: number.end, piastres: false };
  const unit = lookup(UNIT_WORDS, tokens[head.end]);
  if (unit !== undefined) {
    // "خمسة جنيه ونص", "two pounds and fifty piastres", "خمسة دولار ونص".
    const units = { ...head, end: head.end + 1 };
    return withTail(units, readUnitTail(tokens, units.end, unit.pound));
  }
  const fraction = readFraction(tokens, head.end);
  if (fraction !== undefined) {
    // "five and a half pounds", "خمسة ونص".
    const joined = withTail(head, fraction);
    const unitAfter = lookup(UNIT_WORDS, tokens[joined.end]) !== undefined;
    return unitAfter ? { ...joined, end: joined.end + 1 } : joined;
  }
  return head;
}

/** A currency word with no number before it: "جنيه ونص" is 1.50, "دولارين" is 2. */
function readUnitWordAmount(tokens: readonly string[], start: number): Piece | undefined {
  const unit = lookup(UNIT_WORDS, tokens[start]);
  if (unit === undefined) {
    return undefined;
  }
  const head: Piece = { value: decimal(unit.count), end: start + 1, piastres: false };
  const tail = readUnitTail(tokens, head.end, unit.pound);
  // A lone "جنيه", "pounds" or "دولار" is not an amount; the dual "جنيهين" is.
  return tail === undefined && unit.count === 1 ? undefined : withTail(head, tail);
}

/** "نص جنيه", "ربع دولار", "half a pound". */
function readFractionOfUnit(tokens: readonly string[], start: number): Piece | undefined {
  const hundredthsOfUnit = lookup(FRACTION_WORDS, tokens[start]);
  if (hundredthsOfUnit === undefined) {
    return undefined;
  }
  const at = tokens[start + 1] === INDEFINITE_ARTICLE ? start + 2 : start + 1;
  if (lookup(UNIT_WORDS, tokens[at])?.count !== 1) {
    return undefined;
  }
  return { value: decimal(hundredthsOfUnit, 2), end: at + 1, piastres: false };
}

/**
 * The amounts in `tokens` from `from` up to `to` (exclusive). Only that slice is read, so
 * no amount reaches past `to` into an excluded span.
 */
function findAmountsBetween(tokens: readonly string[], from: number, to: number): AmountMatch[] {
  const segment = tokens.slice(from, to);
  const amounts: AmountMatch[] = [];
  for (let start = 0; start < segment.length;) {
    const found =
      readNumberAmount(segment, start) ??
      readUnitWordAmount(segment, start) ??
      readFractionOfUnit(segment, start);
    if (found === undefined) {
      start += 1;
      continue;
    }
    const amount = toDecimalString(found.value);
    const span = { start: from + start, end: from + found.end };
    amounts.push(
      found.piastres ? { amount, ...span, impliedCurrency: 'EGP' } : { amount, ...span },
    );
    start = found.end;
  }
  return amounts;
}

/**
 * Finds every amount in normalised tokens, left to right: numbers with their currency words,
 * halves, quarters and piastres combined exactly ("اتنين جنيه وخمسين قرش" is 2.5). An amount's
 * span includes the currency noun that follows it. Choosing which amount is used when there
 * are several is the job of `resolveMoney`.
 *
 * No amount uses a token inside an `excluded` span: pass the date expressions from
 * `findDates` so that "تلات" in "من تلات أيام" cannot become the amount (FR-027, ADR 0003).
 */
export function findAmounts(
  tokens: readonly string[],
  excluded: readonly TokenSpan[] = [],
): AmountMatch[] {
  const amounts: AmountMatch[] = [];
  let from = 0;
  for (const span of [...excluded].sort((a, b) => a.start - b.start)) {
    amounts.push(...findAmountsBetween(tokens, from, span.start));
    from = Math.max(from, span.end);
  }
  amounts.push(...findAmountsBetween(tokens, from, tokens.length));
  return amounts;
}

/**
 * The first amount in a transcript that is not part of a date expression, or undefined when
 * it has none. To choose the amount by the rule of ADR 0003 step 4 and get its currency, use
 * `parseMoney`.
 */
export function parseAmount(text: string): AmountMatch | undefined {
  const tokens = normalize(text, AMOUNT_VOCABULARY);
  return findAmounts(tokens, findDates(tokens))[0];
}
