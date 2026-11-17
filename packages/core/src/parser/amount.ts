import { add, decimal, hundredths, toDecimalString, type Decimal } from './decimal.js';
import {
  CONJUNCTION_WORDS,
  FRACTION_WORDS,
  INDEFINITE_ARTICLE,
  PIASTRE_WORDS,
  POUND_WORDS,
} from './lexicon/numbers.js';
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

interface Piece {
  readonly value: Decimal;
  readonly end: number;
  readonly piastres: boolean;
}

const lookup = (record: Readonly<Record<string, number>>, token: string | undefined) =>
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
  const hundredthsOfPound = lookup(FRACTION_WORDS, tokens[at]);
  if (hundredthsOfPound === undefined) {
    return undefined;
  }
  return { value: decimal(hundredthsOfPound, 2), end: at + 1, piastres: false };
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

/** What may follow pounds: a fraction, or piastres with or without a conjunction. */
function readPoundTail(tokens: readonly string[], index: number): Piece | undefined {
  const fraction = readFraction(tokens, index);
  if (fraction !== undefined) {
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

/** A number, then optionally a pound word, a fraction or piastres. */
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
  if (lookup(POUND_WORDS, tokens[head.end]) !== undefined) {
    // "خمسة جنيه ونص", "two pounds and fifty piastres".
    const pounds = { ...head, end: head.end + 1 };
    return withTail(pounds, readPoundTail(tokens, pounds.end));
  }
  const fraction = readFraction(tokens, head.end);
  if (fraction !== undefined) {
    // "five and a half pounds", "خمسة ونص".
    const joined = withTail(head, fraction);
    const pound = lookup(POUND_WORDS, tokens[joined.end]) !== undefined;
    return pound ? { ...joined, end: joined.end + 1 } : joined;
  }
  return head;
}

/** A pound word with no number before it: "جنيه ونص" is 1.50, "جنيهين" is 2. */
function readPoundWordAmount(tokens: readonly string[], start: number): Piece | undefined {
  const pounds = lookup(POUND_WORDS, tokens[start]);
  if (pounds === undefined) {
    return undefined;
  }
  const head: Piece = { value: decimal(pounds), end: start + 1, piastres: false };
  const tail = readPoundTail(tokens, head.end);
  // A lone "جنيه" or "pounds" is not an amount; the dual "جنيهين" is.
  return tail === undefined && pounds === 1 ? undefined : withTail(head, tail);
}

/** "نص جنيه", "ربع جنيه", "half a pound". */
function readFractionOfPound(tokens: readonly string[], start: number): Piece | undefined {
  const hundredthsOfPound = lookup(FRACTION_WORDS, tokens[start]);
  if (hundredthsOfPound === undefined) {
    return undefined;
  }
  const at = tokens[start + 1] === INDEFINITE_ARTICLE ? start + 2 : start + 1;
  if (lookup(POUND_WORDS, tokens[at]) !== 1) {
    return undefined;
  }
  return { value: decimal(hundredthsOfPound, 2), end: at + 1, piastres: false };
}

/**
 * Finds every amount in normalised tokens, left to right: numbers with their pound words,
 * halves, quarters and piastres combined exactly ("اتنين جنيه وخمسين قرش" is 2.5). Choosing
 * which amount is used when there are several is the job of the amount rule (T-005).
 */
export function findAmounts(tokens: readonly string[]): AmountMatch[] {
  const amounts: AmountMatch[] = [];
  for (let start = 0; start < tokens.length;) {
    const found =
      readNumberAmount(tokens, start) ??
      readPoundWordAmount(tokens, start) ??
      readFractionOfPound(tokens, start);
    if (found === undefined) {
      start += 1;
      continue;
    }
    const amount = toDecimalString(found.value);
    amounts.push(
      found.piastres
        ? { amount, start, end: found.end, impliedCurrency: 'EGP' }
        : { amount, start, end: found.end },
    );
    start = found.end;
  }
  return amounts;
}

/** The first amount in a transcript, or undefined when it has none. */
export function parseAmount(text: string): AmountMatch | undefined {
  return findAmounts(normalize(text))[0];
}
