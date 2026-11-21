// Display formatting for amounts and dates (FR-022, FR-015). Built from fixed tables and string
// operations only, never from Intl or toLocale*, so the output cannot differ between browsers or
// WebView versions and never contains an Arabic-Indic digit (architecture, "Not chosen as
// libraries"; the lint configuration forbids those APIs in this package and in the web app).
import { parseCalendarDate } from './calendar.js';
import { getCurrency, type CurrencyCode } from './currencies.js';
import { TRANSLATIONS } from './i18n/index.js';
import { isLanguage, type Language } from './language.js';
import { fromMinor } from './money.js';

/**
 * Between the number and the currency label: a no-break space (U+00A0), so a line never breaks
 * between them.
 */
export const AMOUNT_LABEL_SEPARATOR = ' ';

/** An amount for display, in two parts so the number can be isolated left to right on its own. */
export interface AmountParts {
  /** Western digits grouped in threes with "," and exactly the currency's decimals after ".". */
  readonly number: string;
  /** The currency as shown in the language: the code, or ج.م for EGP in Arabic (FR-022 c2). */
  readonly label: string;
}

function checkLanguage(language: Language): void {
  if (!isLanguage(language)) {
    throw new RangeError('Unknown interface language');
  }
}

/** Inserts "," between each group of three digits of the whole part. */
const group = (whole: string) => whole.replace(/\B(?=(?:[0-9]{3})+$)/g, ',');

/**
 * The parts of an amount given in the currency's minor unit (piastres, fils): "1,234.50" and "EGP"
 * in English or "ج.م" in Arabic for 123450 EGP. Zero and totals above one expense's maximum are
 * valid (FR-016). A negative, fractional or unsafe number of minor units, an unknown currency or
 * an unknown language is a programming error and throws a RangeError, as `fromMinor` does.
 */
export function formatAmountParts(
  minor: number,
  currency: CurrencyCode,
  language: Language,
): AmountParts {
  checkLanguage(language);
  const [whole = '', fraction = ''] = fromMinor(minor, currency).split('.');
  return { number: `${group(whole)}.${fraction}`, label: getCurrency(currency).symbol[language] };
}

/**
 * The amount as one string, number first and label after it in both languages: "1,234.50 EGP",
 * "1,234.50 ج.م" (joined by `AMOUNT_LABEL_SEPARATOR`). For places that take plain text, such as an
 * `aria-label`; on screen, the web app's `<Amount>` isolates the number in `<bdi dir="ltr">`.
 */
export function formatAmount(minor: number, currency: CurrencyCode, language: Language): string {
  const { number, label } = formatAmountParts(minor, currency, language);
  return `${number}${AMOUNT_LABEL_SEPARATOR}${label}`;
}

const MONTH_KEYS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const;

/**
 * A stored date (`YYYY-MM-DD`) for display: day without a leading zero, the month's name from the
 * translations, four-digit year, separated by spaces: "16 Nov 2026", "5 Jan 2026",
 * "16 نوفمبر 2026" (FR-022 criterion 3, Gregorian calendar, Western digits). A date that is not
 * written that way or does not exist, or an unknown language, is a programming error and throws.
 */
export function formatDate(date: string, language: Language): string {
  checkLanguage(language);
  const parsed = parseCalendarDate(date);
  const key = parsed === undefined ? undefined : MONTH_KEYS[parsed.month - 1];
  if (parsed === undefined || key === undefined) {
    throw new RangeError('A date must be a calendar date written YYYY-MM-DD');
  }
  const month = TRANSLATIONS[language].date.months[key];
  return `${String(parsed.day)} ${month} ${date.slice(0, 4)}`;
}
