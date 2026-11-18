import { isCurrencyCode, type CurrencyCode } from '../currencies.js';
import { AMOUNT_VOCABULARY, findAmounts, type AmountMatch } from './amount.js';
import { findDates } from './dates.js';
import { CURRENCY_PHRASES, type CurrencyPhrase } from './lexicon/currencies.js';
import { normalize } from './normalize.js';

/**
 * A currency word or phrase found in a token list; `end` is exclusive. `currency` is
 * undefined for a currency outside the supported list ("yen", "ريال قطري").
 */
export interface CurrencyMatch {
  readonly start: number;
  readonly end: number;
  readonly currency: CurrencyCode | undefined;
}

/**
 * The amount and currency of an utterance, and whether each needs the user's attention.
 * `amount` is exact decimal text, never rounded or clamped (FR-025 criterion 8), and is
 * absent when the utterance has none.
 */
export interface ParsedMoney {
  readonly amount?: string;
  readonly currency: CurrencyCode;
  readonly attention: { readonly amount: boolean; readonly currency: boolean };
}

const PHRASES_BY_FIRST_WORD = new Map<string, CurrencyPhrase[]>();
for (const phrase of CURRENCY_PHRASES) {
  const [first = ''] = phrase.words;
  PHRASES_BY_FIRST_WORD.set(first, [...(PHRASES_BY_FIRST_WORD.get(first) ?? []), phrase]);
}

function phraseAt(tokens: readonly string[], index: number): CurrencyPhrase | undefined {
  let longest: CurrencyPhrase | undefined;
  for (const phrase of PHRASES_BY_FIRST_WORD.get(tokens[index] ?? '') ?? []) {
    const matches = phrase.words.every((word, offset) => tokens[index + offset] === word);
    if (matches && phrase.words.length > (longest?.words.length ?? 0)) {
      longest = phrase;
    }
  }
  return longest;
}

/**
 * Finds the currency words in normalised tokens (ADR 0003 step 5, FR-028), left to right,
 * without overlaps, longest phrase first ("pounds sterling" before "pounds"). Tokens must come
 * from `normalize` with a vocabulary that includes `CURRENCY_VOCABULARY`.
 */
export function findCurrencies(tokens: readonly string[]): CurrencyMatch[] {
  const matches: CurrencyMatch[] = [];
  for (let index = 0; index < tokens.length;) {
    const phrase = phraseAt(tokens, index);
    if (phrase === undefined) {
      index += 1;
    } else {
      const end = index + phrase.words.length;
      matches.push({ start: index, end, currency: phrase.currency ?? undefined });
      index = end;
    }
  }
  return matches;
}

/**
 * The currencies said for one amount: currency words inside its span ("خمسين جنيه") or
 * directly after it ("20 yen", "50 british pounds"), and EGP when it was said in piastres.
 * Undefined stands for a currency outside the list.
 */
function currenciesOf(
  amount: AmountMatch,
  currencies: readonly CurrencyMatch[],
): Set<CurrencyCode | undefined> {
  const bound = currencies
    .filter(({ start, end }) => (start < amount.end && end > amount.start) || start === amount.end)
    .map(({ currency }) => currency);
  if (amount.impliedCurrency !== undefined) {
    bound.push(amount.impliedCurrency);
  }
  return new Set(bound);
}

/** The one listed currency in `codes`, or undefined when there is none or they disagree. */
function single(codes: ReadonlySet<CurrencyCode | undefined>): CurrencyCode | undefined {
  const [code] = codes;
  return codes.size === 1 ? code : undefined;
}

/**
 * Chooses the amount and its currency (ADR 0003 steps 4 and 5) from the matches of
 * `findAmounts` and `findCurrencies` on the same tokens.
 *
 * Amount: the first amount with a currency word bound to it; otherwise the first amount.
 * Flagged when there is no amount or more than one (FR-025 criteria 6 and 7), or when the
 * chosen amount rests on an inference (`needsConfirmation`).
 *
 * Currency: the currency word bound to the chosen amount, unflagged (FR-028 criteria 2 and
 * 3). A word for a currency outside the list, or two words that disagree, give the default,
 * flagged (criterion 4). When no word is bound to any amount, a currency word elsewhere in
 * the utterance is used but flagged, because it was not said with the amount; no currency
 * word at all gives the default, unflagged (criterion 1).
 *
 * `defaultCurrency` is the user's default currency; a value outside the list is a programming
 * error.
 */
export function resolveMoney(
  amounts: readonly AmountMatch[],
  currencies: readonly CurrencyMatch[],
  defaultCurrency: CurrencyCode,
): ParsedMoney {
  if (!isCurrencyCode(defaultCurrency)) {
    throw new RangeError(`defaultCurrency must be a supported currency code`);
  }
  const bound = amounts
    .map((amount) => ({ amount, codes: currenciesOf(amount, currencies) }))
    .find(({ codes }) => codes.size > 0);
  const amountAttention = (chosen: AmountMatch | undefined) =>
    amounts.length !== 1 || chosen?.needsConfirmation === true;
  if (bound !== undefined) {
    const code = single(bound.codes);
    return {
      amount: bound.amount.amount,
      currency: code ?? defaultCurrency,
      attention: { amount: amountAttention(bound.amount), currency: code === undefined },
    };
  }
  const elsewhere = new Set(currencies.map(({ currency }) => currency));
  const [first] = amounts;
  const result = {
    currency: single(elsewhere) ?? defaultCurrency,
    attention: { amount: amountAttention(first), currency: elsewhere.size > 0 },
  };
  return first === undefined ? result : { amount: first.amount, ...result };
}

/**
 * The amount and currency of a transcript. `defaultCurrency` is the user's default currency
 * (FR-028 criterion 1); it is never assumed. Numbers inside date expressions are not amounts.
 */
export function parseMoney(text: string, defaultCurrency: CurrencyCode): ParsedMoney {
  const tokens = normalize(text, AMOUNT_VOCABULARY);
  return resolveMoney(
    findAmounts(tokens, findDates(tokens)),
    findCurrencies(tokens),
    defaultCurrency,
  );
}
