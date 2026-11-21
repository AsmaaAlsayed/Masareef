/** A Gregorian calendar date with no time of day and no time zone. */
export interface CalendarDate {
  readonly year: number;
  /** 1 for January to 12 for December. */
  readonly month: number;
  readonly day: number;
}

// The stored form of an expense date: four-digit year, two-digit month and day, Western digits.
const ISO_DATE = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;

export const isLeapYear = (year: number) =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/**
 * Reads a date written `YYYY-MM-DD` that exists in the Gregorian calendar (no 31 April, 29 February
 * only in a leap year), without a Date object, so no time zone can move it. Anything else gives
 * `undefined`.
 */
export function parseCalendarDate(text: string): CalendarDate | undefined {
  const parts = ISO_DATE.exec(text);
  const [year, month, day] = (parts?.slice(1) ?? []).map(Number);
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month)
  ) {
    return undefined;
  }
  return { year, month, day };
}
