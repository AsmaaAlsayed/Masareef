import { toWesternDigits } from '../digits.js';
import { NUMBER_VOCABULARY } from './lexicon/numbers.js';

// Harakat, superscript alef and Quranic marks, then tatweel.
const DIACRITICS_AND_TATWEEL = /[ً-ٰٟۖ-ۭـ]/g;

const LETTER_FORMS: Readonly<Record<string, string>> = {
  أ: 'ا',
  إ: 'ا',
  آ: 'ا',
  ٱ: 'ا',
  ى: 'ي',
  ی: 'ي',
  ة: 'ه',
  ک: 'ك',
};
const LETTER_FORM_PATTERN = new RegExp(`[${Object.keys(LETTER_FORMS).join('')}]`, 'g');

// A comma between digits is a thousands separator only when every group after it has three
// digits ("1,250,000"); any other comma is punctuation and separates two numbers ("5,5").
const THOUSANDS_SEPARATOR = /(?<=[0-9]),(?=[0-9]{3}(?![0-9]))/g;

// Digit runs with an optional decimal fraction, Latin words, Arabic words. Everything else
// (punctuation, symbols, spaces) separates tokens and is dropped.
const TOKEN =
  /[0-9]+(?:\.[0-9]+)?|(?:(?=\p{Script=Latin})\p{L})+|(?:(?=\p{Script=Arabic})\p{L})+/gu;

const ARTICLE = 'ال';
// Particles written attached to the next word: and, with/for, so, to, like.
const PARTICLES = ['و', 'ب', 'ف', 'ل', 'ك'];

/**
 * Splits attached particles and the definite article from one token. A particle is split
 * off only when what remains is a known word, so words that merely begin with the same
 * letter ("واحد", "بقالة") stay whole. The article is dropped from a known word, and from
 * any word that keeps at least three letters without it ("الغدا"), but not from short words
 * such as "اللي".
 */
function splitToken(token: string, known: ReadonlySet<string>): string[] {
  if (token === ARTICLE) {
    return [];
  }
  if (known.has(token)) {
    return [token];
  }
  const attached = splitParticles(token, known, 2);
  if (attached !== undefined) {
    return attached;
  }
  if (token.startsWith(ARTICLE) && token.length - ARTICLE.length >= 3) {
    return [token.slice(ARTICLE.length)];
  }
  return [token];
}

function splitParticles(
  token: string,
  known: ReadonlySet<string>,
  depth: number,
): string[] | undefined {
  if (known.has(token)) {
    return [token];
  }
  if (token.startsWith(ARTICLE) && known.has(token.slice(ARTICLE.length))) {
    return [token.slice(ARTICLE.length)];
  }
  if (depth === 0) {
    return undefined;
  }
  for (const particle of PARTICLES) {
    if (token.length > particle.length && token.startsWith(particle)) {
      let rest = token.slice(particle.length);
      // ل followed by the article is written لل ("للتاكسي").
      if (particle === 'ل' && rest.startsWith('ل') && known.has(rest.slice(1))) {
        rest = rest.slice(1);
      }
      const split = splitParticles(rest, known, depth - 1);
      if (split !== undefined) {
        return [particle, ...split];
      }
    }
  }
  return undefined;
}

/**
 * Normalises a transcript and splits it into tokens (ADR 0003 step 1): Unicode NFKC;
 * diacritics and tatweel removed; Arabic-Indic and Eastern Arabic digits made Western; alef,
 * ya and ta marbuta forms unified; Latin lower-cased; punctuation stripped; digits split from
 * letters and Arabic from Latin; attached particles split off; the definite article dropped.
 *
 * `vocabulary` lists the words the caller recognises; particles are split only from those.
 * It defaults to the number vocabulary; later lexicons pass a union that includes it.
 */
export function normalize(
  text: string,
  vocabulary: ReadonlySet<string> = NUMBER_VOCABULARY,
): string[] {
  const cleaned = toWesternDigits(text.normalize('NFKC').replace(DIACRITICS_AND_TATWEEL, ''))
    .replace(LETTER_FORM_PATTERN, (letter) => LETTER_FORMS[letter] ?? letter)
    .toLowerCase()
    .replace(/٫/g, '.')
    .replace(/٬/g, ',')
    .replace(THOUSANDS_SEPARATOR, '');
  return Array.from(cleaned.matchAll(TOKEN), ([token]) => token).flatMap((token) =>
    splitToken(token, vocabulary),
  );
}
