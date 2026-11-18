import {
  add,
  decimal,
  hundredths,
  multiply,
  parseDecimal,
  times,
  toDecimalString,
  type Decimal,
} from './decimal.js';
import {
  CONJUNCTION_WORDS,
  FRACTION_WORDS,
  INDEFINITE_ARTICLE,
  COMMON_PIASTRE_COUNTS,
  COUNT_INTRODUCER,
  EACH_ONE_ARABIC,
  EACH_WORD,
  EACH_WORDS_AFTER_PRICE,
  LESS_WORD,
  ONE_WORDS,
  PIASTRE_WORDS,
  PRICE_MARKERS,
  QUANTITY_UNIT_WORDS,
  SCALE_WORDS,
  SINGULAR_POUND_WORDS,
  WATER_CONTEXT_WORDS,
  WATER_WORD,
} from './lexicon/numbers.js';
import { CURRENCY_VOCABULARY, UNIT_WORDS } from './lexicon/currencies.js';
import { DATE_AND_NUMBER_VOCABULARY, findDates } from './dates.js';
import { normalize } from './normalize.js';
import { readNumber, type NumberSpan } from './numbers.js';

/**
 * An amount found in a token list. `amount` is exact decimal text in major units ("50",
 * "5.5", "0.75") as `toMinor` reads it; it is never rounded or clamped, because limits and
 * precision are checked by the form on Save (FR-025 criterion 8). `impliedCurrency` is EGP
 * when the amount was said in piastres. `needsConfirmation` is true when the amount rests on
 * an inference the user should check. `isCount` is true when the number counts things ("2" in
 * "2 pizzas for 400") and so gives way to any other amount. `end` is exclusive.
 */
export interface AmountMatch {
  readonly amount: string;
  readonly start: number;
  readonly end: number;
  readonly impliedCurrency?: 'EGP';
  readonly needsConfirmation?: true;
  readonly isCount?: true;
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
  readonly needsConfirmation?: true;
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

/** "إلا ربع": a fraction taken off, so its value is negative. */
function readLessFraction(tokens: readonly string[], index: number): Piece | undefined {
  const hundredthsOfUnit =
    tokens[index] === LESS_WORD ? lookup(FRACTION_WORDS, tokens[index + 1]) : undefined;
  return hundredthsOfUnit === undefined
    ? undefined
    : { value: decimal(-hundredthsOfUnit, 2), end: index + 2, piastres: false };
}

const readAnyFraction = (tokens: readonly string[], index: number) =>
  readFraction(tokens, index) ?? readLessFraction(tokens, index);

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
 * Piastres with no word for them, right after a pound word ("خمسة جنيه وخمسين", "three pounds
 * fifty", PQ-07): a whole number from 1 to 99, with at most "و"/"and" before it.
 *
 * The same words can start a second expense ("خمسين جنيه وعشرين تاكسي"), so what comes next
 * decides. Nothing more in the utterance: piastres. Another number or currency word: never.
 * Other words: piastres only for 25, 50 and 75, the amounts people say this way, and flagged
 * for the user to confirm; any other number stays a separate amount (FR-025 criterion 7).
 */
function readBarePiastres(
  tokens: readonly string[],
  index: number,
  conjunctionRequired: boolean,
): Piece | undefined {
  const at = afterConjunction(tokens, index, conjunctionRequired);
  const number = at === undefined ? undefined : readNumber(tokens, at);
  if (number === undefined || number.value.places !== 0) {
    return undefined;
  }
  const { units } = number.value;
  if (units < 1n || units > 99n) {
    return undefined;
  }
  const piece: Piece = { value: hundredths(number.value), end: number.end, piastres: false };
  const next = tokens[number.end];
  if (next === undefined) {
    return piece;
  }
  const startsAnotherAmount =
    readNumber(tokens, number.end) !== undefined || lookup(UNIT_WORDS, next) !== undefined;
  return !startsAnotherAmount && COMMON_PIASTRE_COUNTS.has(units)
    ? { ...piece, needsConfirmation: true }
    : undefined;
}

/**
 * What may follow a currency word: a fraction ("دولار ونص"), and after pounds only, piastres
 * with or without their word. `barePiastres` says whether piastres with no word may follow.
 */
function readUnitTail(
  tokens: readonly string[],
  index: number,
  pound: boolean,
  barePiastres: 'any' | 'after-conjunction' | 'none' = 'any',
): Piece | undefined {
  const fraction = readAnyFraction(tokens, index);
  if (fraction !== undefined || !pound) {
    return fraction;
  }
  const at = afterConjunction(tokens, index, false) ?? index;
  const piastres = readPiastres(tokens, at);
  return piastres !== undefined || barePiastres === 'none'
    ? piastres
    : readBarePiastres(tokens, index, barePiastres === 'after-conjunction');
}

/** Joins a tail to its head. A tail that would take the amount to zero or below is ignored. */
function withTail(head: Piece, tail: Piece | undefined): Piece {
  if (tail === undefined) {
    return head;
  }
  const value = add(head.value, tail.value);
  if (value.units <= 0n) {
    return head;
  }
  const joined: Piece = { value, end: tail.end, piastres: head.piastres || tail.piastres };
  return tail.needsConfirmation ? { ...joined, needsConfirmation: true } : joined;
}

/** A fraction after a number: of its thousand ("ألف ونص"), or of one, then maybe a scale word. */
function readNumberFraction(
  tokens: readonly string[],
  number: NumberSpan,
  head: Piece,
): Piece | undefined {
  const fraction = readAnyFraction(tokens, head.end);
  if (fraction === undefined) {
    return undefined;
  }
  const { trailingScale } = number;
  if (trailingScale !== undefined) {
    return withTail(head, { ...fraction, value: multiply(fraction.value, BigInt(trailingScale)) });
  }
  const joined = withTail(head, fraction);
  // "one and a half thousand", "خمسة ونص ألف".
  const scale = lookup(SCALE_WORDS, tokens[joined.end]);
  return scale !== undefined && scale.count <= 1 && joined.end === fraction.end
    ? { ...joined, value: multiply(joined.value, BigInt(scale.scale)), end: joined.end + 1 }
    : joined;
}

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
  const joined = readNumberFraction(tokens, number, head);
  if (joined !== undefined) {
    // "five and a half pounds", "خمسة ونص".
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
  // "pounds 50" and "pounds and 20" name the currency; they do not say one pound.
  const barePiastres = SINGULAR_POUND_WORDS.has(tokens[start] ?? '') ? 'after-conjunction' : 'none';
  const tail = readUnitTail(tokens, head.end, unit.pound, barePiastres);
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
    amounts.push({
      amount,
      ...span,
      ...(found.piastres ? { impliedCurrency: 'EGP' as const } : {}),
      ...(found.needsConfirmation ? { needsConfirmation: true as const } : {}),
    });
    start = found.end;
  }
  return amounts;
}

const isOneWord = (token: string | undefined) => token !== undefined && ONE_WORDS.has(token);

/** True when "كل واحد"/"كل واحدة" starts at `index`. */
const isEachOneAt = (tokens: readonly string[], index: number) =>
  tokens[index] === EACH_ONE_ARABIC && isOneWord(tokens[index + 1]);

/** "كل واحدة" is not the number one, so no amount may use it. */
function eachOneSpans(tokens: readonly string[]): TokenSpan[] {
  return tokens.flatMap((_, start) =>
    isEachOneAt(tokens, start) ? [{ start, end: start + 2 }] : [],
  );
}

/**
 * "ميه" right after a bill or utility word, with or without "و", is water ("فاتورة المية",
 * "الكهربا والمية", PQ-10). It stays the number 100 when a currency word or a thousand follows
 * it, or "و" and more of a number ("فاتورة مية جنيه", "فاتورة مية وخمسين"), because the article
 * that would tell the two apart is gone after `normalize`.
 */
function waterSpans(tokens: readonly string[]): TokenSpan[] {
  return tokens.flatMap((token, start) => {
    if (token !== WATER_WORD) {
      return [];
    }
    const before = tokens[start - 1];
    const context =
      before !== undefined && CONJUNCTION_WORDS.has(before) ? tokens[start - 2] : before;
    if (context === undefined || !WATER_CONTEXT_WORDS.has(context)) {
      return [];
    }
    const next = tokens[start + 1];
    const staysNumber =
      lookup(UNIT_WORDS, next) !== undefined ||
      lookup(SCALE_WORDS, next) !== undefined ||
      (next !== undefined &&
        CONJUNCTION_WORDS.has(next) &&
        readNumber(tokens, start + 2) !== undefined);
    return staysNumber ? [] : [{ start, end: start + 1 }];
  });
}

/** True when the words around `price` say it is the price of one. */
function isUnitPrice(tokens: readonly string[], price: AmountMatch): boolean {
  // After the price, skipping "for" or "ل" ("200 for each", "لكل واحدة").
  const next = tokens[price.end];
  const from = next === 'for' || next === 'ل' ? price.end + 1 : price.end;
  const after = tokens[from];
  if ((after !== undefined && EACH_WORDS_AFTER_PRICE.has(after)) || isEachOneAt(tokens, from)) {
    return true;
  }
  // Before the price, skipping "for", "at" or "ب".
  const previous = tokens[price.start - 1];
  const at =
    previous !== undefined && PRICE_MARKERS.has(previous) ? price.start - 2 : price.start - 1;
  return tokens[at] === EACH_WORD || (isOneWord(tokens[at]) && tokens[at - 1] === EACH_ONE_ARABIC);
}

/** True when the amount's own tokens include a currency or piastre word. */
const hasUnitWord = (tokens: readonly string[], { start, end }: AmountMatch) =>
  tokens
    .slice(start, end)
    .some(
      (token) =>
        lookup(UNIT_WORDS, token) !== undefined || lookup(PIASTRE_WORDS, token) !== undefined,
    );

/** True for a whole number with no currency word. */
function isPlainWholeNumber(tokens: readonly string[], amount: AmountMatch): boolean {
  return /^[0-9]+$/.test(amount.amount) && !hasUnitWord(tokens, amount);
}

/**
 * Count times unit price ("three tickets at 200 each", "تلات تذاكر كل واحدة بميتين"). Only an
 * explicit "each", "per" or "كل واحد" multiplies, and only by a whole number of two or more
 * said next to the price. The product is exact and flagged, so the user confirms it.
 */
function applyUnitPrice(tokens: readonly string[], amounts: readonly AmountMatch[]): AmountMatch[] {
  const index = amounts.findIndex((amount) => isUnitPrice(tokens, amount));
  const price = amounts[index];
  if (price === undefined) {
    return [...amounts];
  }
  const countIndex = [index - 1, index + 1].find((at) => {
    const candidate = amounts[at];
    return (
      candidate !== undefined &&
      isPlainWholeNumber(tokens, candidate) &&
      BigInt(candidate.amount) >= 2n
    );
  });
  const count = countIndex === undefined ? undefined : amounts[countIndex];
  if (countIndex === undefined || count === undefined) {
    return [...amounts];
  }
  const merged: AmountMatch = {
    ...price,
    amount: toDecimalString(times(parseDecimal(price.amount), parseDecimal(count.amount))),
    start: Math.min(price.start, count.start),
    end: Math.max(price.end, count.end),
    needsConfirmation: true,
  };
  const first = Math.min(index, countIndex);
  return [...amounts.slice(0, first), merged, ...amounts.slice(first + 2)];
}

/**
 * True when `amount` counts things and `next` is the price: it is followed by a word, whole,
 * and the next amount comes after "for", "at" or "ب" with no "و"/"and" between, which would
 * mean a second expense ("lunch 50 and taxi for 20").
 */
function isCountBeforePrice(
  tokens: readonly string[],
  amount: AmountMatch,
  next: AmountMatch | undefined,
): boolean {
  if (next === undefined || !isPlainWholeNumber(tokens, amount)) {
    return false;
  }
  const marker = tokens[next.start - 1];
  const between = tokens.slice(amount.end, next.start - 1);
  return (
    marker !== undefined &&
    PRICE_MARKERS.has(marker) &&
    between[0] !== undefined &&
    !PRICE_MARKERS.has(between[0]) &&
    !between.some((token) => CONJUNCTION_WORDS.has(token))
  );
}

function markCounts(tokens: readonly string[], amounts: readonly AmountMatch[]): AmountMatch[] {
  return amounts.map((amount, index) => {
    const after = tokens[amount.end];
    const counts =
      amount.needsConfirmation !== true &&
      !hasUnitWord(tokens, amount) &&
      ((after !== undefined && QUANTITY_UNIT_WORDS.has(after)) ||
        tokens[amount.start - 1] === COUNT_INTRODUCER ||
        isCountBeforePrice(tokens, amount, amounts[index + 1]));
    return counts ? { ...amount, isCount: true as const } : amount;
  });
}

/**
 * Finds every amount in normalised tokens, left to right: numbers with their currency words,
 * halves, quarters and piastres combined exactly ("اتنين جنيه وخمسين قرش" is 2.5). An amount's
 * span includes the currency noun that follows it. Choosing which amount is used when there
 * are several is the job of `resolveMoney`.
 *
 * No amount uses a token inside an `excluded` span: pass the date expressions from
 * `findDates` so that "تلات" in "من تلات أيام" cannot become the amount (FR-027, ADR 0003).
 * Water ("فاتورة المية") and "كل واحدة" are never amounts. A count and its unit price become one
 * amount, and numbers that only count things are marked `isCount`.
 */
export function findAmounts(
  tokens: readonly string[],
  excluded: readonly TokenSpan[] = [],
): AmountMatch[] {
  const amounts: AmountMatch[] = [];
  const spans = [...excluded, ...eachOneSpans(tokens), ...waterSpans(tokens)];
  let from = 0;
  for (const span of spans.sort((a, b) => a.start - b.start)) {
    amounts.push(...findAmountsBetween(tokens, from, span.start));
    from = Math.max(from, span.end);
  }
  amounts.push(...findAmountsBetween(tokens, from, tokens.length));
  return markCounts(tokens, applyUnitPrice(tokens, amounts));
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
