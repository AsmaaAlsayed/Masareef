/**
 * Number, fraction and money-unit words for the utterance parser (ADR 0003 step 2).
 *
 * Every word is written in its normalised form (see `normalize`): no diacritics, alef forms
 * written as ا, ى written as ي, ة written as ه, Latin in lower case. This list is the team's
 * draft and is reviewed by a native Egyptian Arabic speaker before release (OQ-03, T-085).
 */

/** Words that stand for one value below 1000 and combine with others by addition. */
export const VALUE_WORDS: Readonly<Record<string, number>> = Object.freeze({
  // Arabic units, Egyptian and Standard spellings, masculine and feminine forms.
  صفر: 0,
  واحد: 1,
  واحده: 1,
  اتنين: 2,
  اثنين: 2,
  اثنان: 2,
  اتنان: 2,
  اثنتين: 2,
  اثنتان: 2,
  اتنتين: 2,
  تلاته: 3,
  ثلاثه: 3,
  تلات: 3,
  ثلاث: 3,
  اربعه: 4,
  اربع: 4,
  خمسه: 5,
  خمس: 5,
  سته: 6,
  ست: 6,
  سبعه: 7,
  سبع: 7,
  تمانيه: 8,
  ثمانيه: 8,
  تمان: 8,
  ثمان: 8,
  تماني: 8,
  ثماني: 8,
  تسعه: 9,
  تسع: 9,
  عشره: 10,
  عشر: 10,
  // Egyptian teens, with the ت and ط spellings recognisers produce.
  حداشر: 11,
  احداشر: 11,
  اتناشر: 12,
  اطناشر: 12,
  اثناشر: 12,
  تلتاشر: 13,
  تلطاشر: 13,
  اربعتاشر: 14,
  اربعطاشر: 14,
  خمستاشر: 15,
  خمسطاشر: 15,
  ستاشر: 16,
  سطاشر: 16,
  سبعتاشر: 17,
  سبعطاشر: 17,
  تمنتاشر: 18,
  تمنطاشر: 18,
  تسعتاشر: 19,
  تسعطاشر: 19,
  // Arabic tens, Egyptian (-ين) and Standard nominative (-ون) forms.
  عشرين: 20,
  عشرون: 20,
  تلاتين: 30,
  ثلاثين: 30,
  ثلاثون: 30,
  اربعين: 40,
  اربعون: 40,
  خمسين: 50,
  خمسون: 50,
  ستين: 60,
  ستون: 60,
  سبعين: 70,
  سبعون: 70,
  تمانين: 80,
  ثمانين: 80,
  ثمانون: 80,
  تسعين: 90,
  تسعون: 90,
  // Arabic two hundred, written as one word.
  ميتين: 200,
  متين: 200,
  مئتين: 200,
  مائتين: 200,
  مئتان: 200,
  مائتان: 200,
  // The Standard Arabic construct form, before a noun ("مائتي جنيه").
  مئتي: 200,
  مائتي: 200,
  // English.
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
});

/** Arabic 300 to 900 written as one word: a unit stem joined to a word for hundred. */
const HUNDRED_STEMS: Readonly<Record<number, readonly string[]>> = {
  3: ['تلت', 'تلات', 'ثلاث', 'ثلث'],
  4: ['ربع', 'اربع'],
  5: ['خمس'],
  6: ['ست'],
  7: ['سبع'],
  8: ['تمن', 'تمان', 'ثمان', 'ثمن'],
  9: ['تسع'],
};

/** Arabic spellings of "hundred"; "ميت" is the form used before a noun ("ميت جنيه"). */
const ARABIC_HUNDREDS = ['ميه', 'ميت', 'مائه', 'مئه'];

/** The word for one hundred. After a unit with no "and" it multiplies ("خمس مية", "five hundred"). */
export const HUNDRED_WORDS: ReadonlySet<string> = new Set([...ARABIC_HUNDREDS, 'hundred']);

export const COMPOUND_HUNDRED_WORDS: Readonly<Record<string, number>> = Object.freeze(
  Object.fromEntries(
    Object.entries(HUNDRED_STEMS).flatMap(([unit, stems]) =>
      stems.flatMap((stem) =>
        ARABIC_HUNDREDS.map((hundred) => [stem + hundred, Number(unit) * 100]),
      ),
    ),
  ),
);

/** Egyptian thousands said as one word, a count fused to "تلاف" ("خمستلاف" is 5000). */
const FUSED_THOUSANDS: Readonly<Record<string, number>> = {
  تلاتلاف: 3,
  تلتلاف: 3,
  تلاتتلاف: 3,
  تلتتلاف: 3,
  اربعتلاف: 4,
  اربعتالاف: 4,
  خمستلاف: 5,
  خمستالاف: 5,
  ستلاف: 6,
  ستتلاف: 6,
  ستالاف: 6,
  سبعتلاف: 7,
  سبعتالاف: 7,
  تمنتلاف: 8,
  تمنتالاف: 8,
  تمانتلاف: 8,
  تمانتالاف: 8,
  تسعتلاف: 9,
  تسعتالاف: 9,
  عشرتلاف: 10,
  عشرتالاف: 10,
};

/**
 * Thousand and million. `count` is the multiplier the word carries itself: 1 for "ألف" (which
 * may also multiply the number before it), 2 or more for words that already say how many (the
 * dual "ألفين", the fused "خمستلاف"), and 0 for plurals such as "آلاف" that need a number before
 * them ("تلات تلاف").
 */
export const SCALE_WORDS: Readonly<Record<string, { scale: number; count: number }>> =
  Object.freeze({
    ...Object.fromEntries(
      Object.entries(FUSED_THOUSANDS).map(([word, count]) => [word, { scale: 1000, count }]),
    ),
    الف: { scale: 1000, count: 1 },
    الفين: { scale: 1000, count: 2 },
    الفان: { scale: 1000, count: 2 },
    الفي: { scale: 1000, count: 2 },
    الاف: { scale: 1000, count: 0 },
    تلاف: { scale: 1000, count: 0 },
    مليون: { scale: 1_000_000, count: 1 },
    مليونين: { scale: 1_000_000, count: 2 },
    مليونان: { scale: 1_000_000, count: 2 },
    مليوني: { scale: 1_000_000, count: 2 },
    ملايين: { scale: 1_000_000, count: 0 },
    thousand: { scale: 1000, count: 1 },
    million: { scale: 1_000_000, count: 1 },
  });

/**
 * Standard Arabic teens are two words: a unit then "عشر" or "عشره" ("خمسة عشر"). These two
 * words mean 1 and 2 only in that position; on its own "احد" is also Sunday.
 */
export const TEEN_PREFIX_WORDS: Readonly<Record<string, number>> = Object.freeze({
  احد: 1,
  احدي: 1,
  اثنا: 2,
  اثني: 2,
  اثنتا: 2,
  اثنتي: 2,
});

export const TEEN_SUFFIX_WORDS: ReadonlySet<string> = new Set(['عشر', 'عشره']);

/** "و" and "and" join the parts of a number and of an amount. */
export const CONJUNCTION_WORDS: ReadonlySet<string> = new Set(['و', 'and']);

/** English "a" stands for one before hundred, thousand, million, half and quarter. */
export const INDEFINITE_ARTICLE = 'a';

/** "إلا": the fraction after it is taken off ("عشرة إلا ربع" is 9.75). */
export const LESS_WORD = 'الا';

/** Fractions of a pound, in hundredths. */
export const FRACTION_WORDS: Readonly<Record<string, number>> = Object.freeze({
  نص: 50,
  نصف: 50,
  half: 50,
  ربع: 25,
  quarter: 25,
});

/**
 * Words for the pound that join a number to its fraction or piastres ("خمسة جنيه ونص").
 * The value is how many pounds the word itself says when no number comes before it: the dual
 * "جنيهين" is two. Which currency a pound word means is decided with the currency words (T-005).
 */
export const POUND_WORDS: Readonly<Record<string, number>> = Object.freeze({
  جنيه: 1,
  جنيهات: 1,
  جنيهين: 2,
  pound: 1,
  pounds: 1,
});

/** Pound words that say one pound on their own; a plural such as "pounds" does not. */
export const SINGULAR_POUND_WORDS: ReadonlySet<string> = new Set(['جنيه', 'جنيهين', 'pound']);

/**
 * Piastres people say with no word for them ("خمسة جنيه وخمسين"). When more words follow, only
 * these are read as piastres; any other number more likely starts a second expense.
 */
export const COMMON_PIASTRE_COUNTS: ReadonlySet<bigint> = new Set([25n, 50n, 75n]);

/** Words for the piastre, a hundredth of an Egyptian pound. Piastres imply EGP (FR-025 c3). */
export const PIASTRE_WORDS: Readonly<Record<string, number>> = Object.freeze({
  قرش: 1,
  قروش: 1,
  قرشين: 2,
  piastre: 1,
  piastres: 1,
  piaster: 1,
  piasters: 1,
});

/** Every word above: the default vocabulary that `normalize` protects and splits particles from. */
export const NUMBER_VOCABULARY: ReadonlySet<string> = new Set([
  ...Object.keys(VALUE_WORDS),
  ...HUNDRED_WORDS,
  ...Object.keys(COMPOUND_HUNDRED_WORDS),
  ...Object.keys(SCALE_WORDS),
  ...Object.keys(TEEN_PREFIX_WORDS),
  ...TEEN_SUFFIX_WORDS,
  ...CONJUNCTION_WORDS,
  ...Object.keys(FRACTION_WORDS),
  ...Object.keys(POUND_WORDS),
  ...Object.keys(PIASTRE_WORDS),
]);
