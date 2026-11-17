import { decimal, multiply, parseDecimal, toDecimalString, type Decimal } from './decimal.js';
import {
  COMPOUND_HUNDRED_WORDS,
  CONJUNCTION_WORDS,
  HUNDRED_WORDS,
  INDEFINITE_ARTICLE,
  SCALE_WORDS,
  TEEN_PREFIX_WORDS,
  TEEN_SUFFIX_WORDS,
  VALUE_WORDS,
} from './lexicon/numbers.js';

/** A number found in a token list; `end` is exclusive. */
export interface NumberMatch {
  readonly value: string;
  readonly start: number;
  readonly end: number;
}

/** Internal form of a match, with the exact value. */
export interface NumberSpan {
  readonly value: Decimal;
  readonly start: number;
  readonly end: number;
}

const DIGITS = /^[0-9]+(?:\.[0-9]+)?$/;

/** A word read at a position, possibly spanning two tokens ("خمسة عشر"). */
type Word =
  | { kind: 'value'; value: number; length: number }
  | { kind: 'hundred'; length: number }
  | { kind: 'scale'; scale: number; count: 0 | 1 | 2; length: number };

const isOwn = (record: object, key: string) => Object.hasOwn(record, key);

function wordAt(tokens: readonly string[], index: number): Word | undefined {
  const token = tokens[index];
  if (token === undefined) {
    return undefined;
  }
  const next = tokens[index + 1];
  const unit = isOwn(TEEN_PREFIX_WORDS, token)
    ? TEEN_PREFIX_WORDS[token]
    : isOwn(VALUE_WORDS, token)
      ? VALUE_WORDS[token]
      : undefined;
  // Standard Arabic teens: a unit, then عشر or عشره.
  if (unit !== undefined && unit >= 1 && unit <= 9 && next !== undefined) {
    if (TEEN_SUFFIX_WORDS.has(next)) {
      return { kind: 'value', value: unit + 10, length: 2 };
    }
  }
  if (isOwn(VALUE_WORDS, token)) {
    return { kind: 'value', value: VALUE_WORDS[token] ?? 0, length: 1 };
  }
  if (isOwn(COMPOUND_HUNDRED_WORDS, token)) {
    return { kind: 'value', value: COMPOUND_HUNDRED_WORDS[token] ?? 0, length: 1 };
  }
  if (HUNDRED_WORDS.has(token)) {
    return { kind: 'hundred', length: 1 };
  }
  const scale = isOwn(SCALE_WORDS, token) ? SCALE_WORDS[token] : undefined;
  if (scale !== undefined) {
    return { kind: 'scale', ...scale, length: 1 };
  }
  // "a hundred", "a thousand": the article stands for one.
  if (token === INDEFINITE_ARTICLE && next !== undefined) {
    const following = wordAt(tokens, index + 1);
    if (following?.kind === 'hundred' || (following?.kind === 'scale' && following.count === 1)) {
      return { kind: 'value', value: 1, length: 1 };
    }
  }
  return undefined;
}

/** The place value of the lowest non-zero digit: 50 -> 10, 250 -> 10, 200 -> 100. */
function lowestPlace(value: number): number {
  let place = 1;
  while (value % (place * 10) === 0) {
    place *= 10;
  }
  return place;
}

/** True when no decimal place is non-zero in both, so "خمسة وسبعين" can become 75. */
function digitsDisjoint(a: number, b: number): boolean {
  for (let x = a, y = b; x > 0 && y > 0; x = Math.floor(x / 10), y = Math.floor(y / 10)) {
    if (x % 10 !== 0 && y % 10 !== 0) {
      return false;
    }
  }
  return true;
}

interface State {
  /** The sum of the groups already closed by thousand or million. */
  readonly total: bigint;
  /** The group below 1000 being built. */
  readonly current: number;
  /** The smallest scale used so far; a later scale must be smaller. */
  readonly lastScale: number;
  readonly started: boolean;
}

const START: State = { total: 0n, current: 0, lastScale: Infinity, started: false };

/**
 * Applies one word to the number being read, or returns undefined when the word cannot
 * continue it (the number ends there). `joined` is true when the word follows "و"/"and".
 */
function step(state: State, word: Word, joined: boolean): State | undefined {
  const { total, current, lastScale, started } = state;
  switch (word.kind) {
    case 'value': {
      if (!started) {
        return { ...state, current: word.value, started: true };
      }
      if (word.value === 0 || !digitsDisjoint(current, word.value)) {
        return undefined;
      }
      // Without "and", only English order works: "twenty five", "two hundred five".
      if (!joined && current > 0 && word.value >= lowestPlace(current)) {
        return undefined;
      }
      return { ...state, current: current + word.value };
    }
    case 'hundred': {
      if (started && !joined && current >= 1 && current <= 99) {
        return { ...state, current: current * 100 };
      }
      return step(state, { kind: 'value', value: 100, length: 1 }, joined);
    }
    case 'scale': {
      if (word.scale >= lastScale) {
        return undefined;
      }
      let group: number;
      if (word.count === 1) {
        if (current > 0 && joined) {
          return undefined;
        }
        group = current > 0 ? current : 1;
      } else if (word.count === 2) {
        if (current > 0) {
          return undefined;
        }
        group = 2;
      } else {
        if (current === 0 || joined) {
          return undefined;
        }
        group = current;
      }
      return {
        total: total + BigInt(group) * BigInt(word.scale),
        current: 0,
        lastScale: word.scale,
        started: true,
      };
    }
  }
}

/** A number written as digits, optionally multiplied by the word after it ("٣ آلاف"). */
function readDigits(tokens: readonly string[], start: number): NumberSpan | undefined {
  const token = tokens[start];
  if (token === undefined || !DIGITS.test(token)) {
    return undefined;
  }
  const value = parseDecimal(token);
  const next = wordAt(tokens, start + 1);
  if (next?.kind === 'hundred') {
    return { value: multiply(value, 100n), start, end: start + 2 };
  }
  if (next?.kind === 'scale' && next.count !== 2) {
    return { value: multiply(value, BigInt(next.scale)), start, end: start + 2 };
  }
  return { value, start, end: start + 1 };
}

/** Reads the number that starts at `start`, if one does. */
export function readNumber(tokens: readonly string[], start: number): NumberSpan | undefined {
  const digits = readDigits(tokens, start);
  if (digits !== undefined) {
    return digits;
  }
  let state = START;
  let index = start;
  for (;;) {
    const token = tokens[index];
    const joined = state.started && token !== undefined && CONJUNCTION_WORDS.has(token);
    const at = joined ? index + 1 : index;
    const word = wordAt(tokens, at);
    const next = word === undefined ? undefined : step(state, word, joined);
    if (word === undefined || next === undefined) {
      break;
    }
    state = next;
    index = at + word.length;
  }
  if (!state.started) {
    return undefined;
  }
  return { value: decimal(state.total + BigInt(state.current)), start, end: index };
}

/** Every number in the token list, left to right, without overlaps. */
export function findNumberSpans(tokens: readonly string[]): NumberSpan[] {
  const spans: NumberSpan[] = [];
  for (let index = 0; index < tokens.length;) {
    const span = readNumber(tokens, index);
    if (span === undefined) {
      index += 1;
    } else {
      spans.push(span);
      index = span.end;
    }
  }
  return spans;
}

/**
 * Finds the numbers in normalised tokens (ADR 0003 step 2): Egyptian and Standard Arabic
 * number words and English number words, compounds joined by "و" or "and", and digit strings.
 * Values are exact decimal text ("1250", "0.75") and are never rounded or clamped.
 */
export function findNumbers(tokens: readonly string[]): NumberMatch[] {
  return findNumberSpans(tokens).map(({ value, start, end }) => ({
    value: toDecimalString(value),
    start,
    end,
  }));
}
