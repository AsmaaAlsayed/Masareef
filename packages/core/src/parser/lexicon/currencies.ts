/**
 * Currency words for the utterance parser (ADR 0003 step 5, FR-028).
 *
 * Every word is written in its normalised form (see `normalize`): no diacritics, alef forms
 * written as ا, ى written as ي, ة written as ه, the definite article dropped ("الجنيه
 * الإسترليني" is read as "جنيه استرليني"), Latin in lower case. This list is the team's
 * draft and is reviewed by a native Egyptian Arabic speaker before release (OQ-03, T-085).
 *
 * Decisions recorded here so a reviewer can challenge them:
 * - "ريال"/"riyal"/"rial" with no qualifier is SAR (FR-028 criterion 3), although Qatar, Oman
 *   and Yemen also use riyals and older Egyptian speech uses "ريال" for 20 piastres.
 * - "دينار"/"dinar" with no qualifier is KWD (criterion 3), although several countries use it.
 * - "bucks", "quid" and "باوند" are not listed: "bucks" is informal US usage that the
 *   requirements do not name, and "باوند" is also a unit of weight.
 * - "£" alone is EGP, flagged. FR-028 makes unqualified pounds EGP, and a recogniser may write
 *   "£" for a spoken "pounds", but the sign is also sterling's, so the user is asked to check.
 *   "E£" is EGP without a flag.
 * - Cents, fils and halalas are not amounts here; only piastres are (FR-025 criterion 3).
 */
import type { CurrencyCode } from '../../currencies.js';
import { PIASTRE_WORDS, POUND_WORDS } from './numbers.js';

/**
 * The nouns of the listed currencies other than the pound, which the amount grammar reads
 * like a pound word ("خمسة دولار ونص" is 5.50, the dual "دولارين" is 2). The value is how
 * many units the word says when no number comes before it.
 */
const OTHER_UNIT_WORDS: Readonly<Record<string, { code: CurrencyCode; count: 1 | 2 }>> =
  Object.freeze({
    دولار: { code: 'USD', count: 1 },
    دولارات: { code: 'USD', count: 1 },
    دولارا: { code: 'USD', count: 1 },
    دولارين: { code: 'USD', count: 2 },
    dollar: { code: 'USD', count: 1 },
    dollars: { code: 'USD', count: 1 },
    يورو: { code: 'EUR', count: 1 },
    euro: { code: 'EUR', count: 1 },
    euros: { code: 'EUR', count: 1 },
    ريال: { code: 'SAR', count: 1 },
    ريالات: { code: 'SAR', count: 1 },
    ريالا: { code: 'SAR', count: 1 },
    ريالين: { code: 'SAR', count: 2 },
    riyal: { code: 'SAR', count: 1 },
    riyals: { code: 'SAR', count: 1 },
    rial: { code: 'SAR', count: 1 },
    rials: { code: 'SAR', count: 1 },
    درهم: { code: 'AED', count: 1 },
    دراهم: { code: 'AED', count: 1 },
    درهما: { code: 'AED', count: 1 },
    درهمين: { code: 'AED', count: 2 },
    dirham: { code: 'AED', count: 1 },
    dirhams: { code: 'AED', count: 1 },
    دينار: { code: 'KWD', count: 1 },
    دنانير: { code: 'KWD', count: 1 },
    دينارا: { code: 'KWD', count: 1 },
    دينارين: { code: 'KWD', count: 2 },
    dinar: { code: 'KWD', count: 1 },
    dinars: { code: 'KWD', count: 1 },
  });

/**
 * Every currency noun the amount grammar reads as a unit, with the number of units it says on
 * its own and whether it is the pound (only pounds take piastres: "جنيه وخمسين قرش").
 */
export const UNIT_WORDS: Readonly<Record<string, { count: number; pound: boolean }>> =
  Object.freeze({
    ...Object.fromEntries(
      Object.entries(POUND_WORDS).map(([word, count]) => [word, { count, pound: true }]),
    ),
    ...Object.fromEntries(
      Object.entries(OTHER_UNIT_WORDS).map(([word, { count }]) => [word, { count, pound: false }]),
    ),
  });

/**
 * Qualifiers that change what a currency noun means. Arabic qualifiers follow the noun
 * ("جنيه استرليني"); English ones precede it ("british pounds"), except "sterling", which
 * follows. `null` marks a currency outside the list (FR-028 criterion 4).
 */
interface Family {
  readonly nouns: readonly string[];
  readonly after: Readonly<Record<string, CurrencyCode | null>>;
  readonly before: Readonly<Record<string, CurrencyCode | null>>;
}

const FAMILIES: readonly Family[] = [
  {
    nouns: Object.keys(POUND_WORDS),
    after: {
      استرليني: 'GBP',
      انجليزي: 'GBP',
      بريطاني: 'GBP',
      sterling: 'GBP',
      مصري: 'EGP',
      سوداني: null,
      لبناني: null,
      سوري: null,
    },
    before: {
      british: 'GBP',
      egyptian: 'EGP',
      sudanese: null,
      lebanese: null,
      syrian: null,
    },
  },
  {
    nouns: ['دولار', 'دولارات', 'دولارا', 'دولارين', 'dollar', 'dollars'],
    after: { امريكي: 'USD', امريكاني: 'USD', كندي: null, استرالي: null },
    before: { us: 'USD', american: 'USD', canadian: null, australian: null },
  },
  {
    nouns: ['ريال', 'ريالات', 'ريالا', 'ريالين', 'riyal', 'riyals', 'rial', 'rials'],
    after: { سعودي: 'SAR', قطري: null, عماني: null, يمني: null, ايراني: null },
    before: { saudi: 'SAR', qatari: null, omani: null, yemeni: null, iranian: null },
  },
  {
    nouns: ['درهم', 'دراهم', 'درهما', 'درهمين', 'dirham', 'dirhams'],
    after: { اماراتي: 'AED', مغربي: null },
    before: { uae: 'AED', emirati: 'AED', moroccan: null },
  },
  {
    nouns: ['دينار', 'دنانير', 'دينارا', 'دينارين', 'dinar', 'dinars'],
    after: {
      كويتي: 'KWD',
      اردني: null,
      بحريني: null,
      عراقي: null,
      ليبي: null,
      تونسي: null,
      جزائري: null,
    },
    before: {
      kuwaiti: 'KWD',
      jordanian: null,
      bahraini: null,
      iraqi: null,
      libyan: null,
      tunisian: null,
      algerian: null,
    },
  },
];

/**
 * Single words for currencies outside the list (FR-028 criterion 4). "ين" (yen) is only
 * recognised as "ين ياباني": on its own it is too short and would be split from words such as
 * "بين" (between) and "فين" (where).
 */
const UNLISTED_WORDS: readonly string[] = [
  'yen',
  'yuan',
  'يوان',
  'rupee',
  'rupees',
  'روبيه',
  'روبيات',
  'lira',
  'liras',
  'lire',
  'ليره',
  'ليرات',
  'franc',
  'francs',
  'فرنك',
  'ruble',
  'rubles',
  'rouble',
  'roubles',
  'روبل',
  'peso',
  'pesos',
  'بيزو',
];

const UNLISTED_PHRASES: readonly (readonly string[])[] = [['ين', 'ياباني']];

/** ISO 4217 codes said or typed as words ("20 usd"). */
const CODE_WORDS: Readonly<Record<string, CurrencyCode>> = Object.freeze({
  egp: 'EGP',
  usd: 'USD',
  eur: 'EUR',
  sar: 'SAR',
  aed: 'AED',
  gbp: 'GBP',
  kwd: 'KWD',
});

/**
 * A currency phrase: its tokens and the currency it names, or null when outside the list.
 * `symbol` marks a sign, which may come before the number; `ambiguous` marks one that could
 * mean another currency, so the result is flagged.
 */
export interface CurrencyPhrase {
  readonly words: readonly string[];
  readonly currency: CurrencyCode | null;
  readonly symbol?: true;
  readonly ambiguous?: true;
}

/** Currency signs as `normalize` leaves them; "\u20C1" stands for both riyal signs. */
const SYMBOL_PHRASES: readonly CurrencyPhrase[] = [
  { words: ['$'], currency: 'USD', symbol: true },
  { words: ['€'], currency: 'EUR', symbol: true },
  { words: ['e£'], currency: 'EGP', symbol: true },
  { words: ['£'], currency: 'EGP', symbol: true, ambiguous: true },
  { words: ['\u20C1'], currency: 'SAR', symbol: true },
];

/** Every currency phrase, built from the lists above. Matching takes the longest first. */
export const CURRENCY_PHRASES: readonly CurrencyPhrase[] = Object.freeze([
  ...Object.keys(POUND_WORDS).map((word) => ({ words: [word], currency: 'EGP' as const })),
  ...Object.keys(PIASTRE_WORDS).map((word) => ({ words: [word], currency: 'EGP' as const })),
  ...Object.entries(OTHER_UNIT_WORDS).map(([word, { code }]) => ({
    words: [word],
    currency: code,
  })),
  ...Object.entries(CODE_WORDS).map(([word, code]) => ({ words: [word], currency: code })),
  ...FAMILIES.flatMap(({ nouns, after, before }) =>
    nouns.flatMap((noun) => [
      ...Object.entries(after).map(([word, currency]) => ({ words: [noun, word], currency })),
      ...Object.entries(before).map(([word, currency]) => ({ words: [word, noun], currency })),
    ]),
  ),
  ...UNLISTED_WORDS.map((word) => ({ words: [word], currency: null })),
  ...UNLISTED_PHRASES.map((words) => ({ words, currency: null })),
  ...SYMBOL_PHRASES,
]);

/**
 * The single currency words that `normalize` protects and splits particles from
 * ("بالدولار" -> "ب" + "دولار"). Qualifiers are not included: an article before them is
 * dropped anyway, and "ين" is left out for the reason given above.
 */
export const CURRENCY_VOCABULARY: ReadonlySet<string> = new Set([
  ...Object.keys(UNIT_WORDS),
  ...Object.keys(PIASTRE_WORDS),
  ...Object.keys(CODE_WORDS),
  ...UNLISTED_WORDS,
]);
