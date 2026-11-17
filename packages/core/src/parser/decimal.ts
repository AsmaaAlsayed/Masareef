/**
 * An exact decimal: `units / 10^places`. The parser adds pounds, fractions and piastres with
 * it, so no amount ever passes through binary floating point and none is rounded or clamped.
 */
export interface Decimal {
  readonly units: bigint;
  readonly places: number;
}

export const decimal = (units: bigint | number, places = 0): Decimal => ({
  units: BigInt(units),
  places,
});

/** Reads Western digits with an optional fraction ("1250", "0.75"). */
export function parseDecimal(text: string): Decimal {
  const [whole = '', fraction = ''] = text.split('.');
  return { units: BigInt(whole + fraction), places: fraction.length };
}

function rescale(value: Decimal, places: number): bigint {
  return value.units * 10n ** BigInt(places - value.places);
}

export function add(a: Decimal, b: Decimal): Decimal {
  const places = Math.max(a.places, b.places);
  return { units: rescale(a, places) + rescale(b, places), places };
}

export function multiply(a: Decimal, factor: bigint): Decimal {
  return { units: a.units * factor, places: a.places };
}

/** Divides by 100, which is exact in decimal: piastres to pounds. */
export const hundredths = (a: Decimal): Decimal => ({ units: a.units, places: a.places + 2 });

/**
 * Shortest exact decimal text, the form `toMinor` reads: "50", "5.5", "0.75", "10.555".
 */
export function toDecimalString(value: Decimal): string {
  const digits = value.units.toString().padStart(value.places + 1, '0');
  const whole = digits.slice(0, digits.length - value.places);
  const fraction = digits.slice(digits.length - value.places).replace(/0+$/, '');
  return fraction === '' ? whole : `${whole}.${fraction}`;
}
