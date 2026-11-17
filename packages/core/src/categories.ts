import type { Localized } from './language.js';

const category = <Code extends string>(code: Code, en: string, ar: string) =>
  Object.freeze({ code, name: Object.freeze({ en, ar }) satisfies Localized });

/**
 * The fixed category list, in the order the selector shows it (FR-014 criteria 1 and 2).
 * The code is what is stored and sent over the API; the names are display text only.
 * The Arabic names are the draft from FR-014, pending native-speaker review (OQ-03).
 */
export const CATEGORIES = Object.freeze([
  category('food_drink', 'Food and drink', 'طعام ومشروبات'),
  category('groceries', 'Groceries', 'بقالة'),
  category('transport', 'Transport', 'مواصلات'),
  category('bills_utilities', 'Bills and utilities', 'فواتير ومرافق'),
  category('housing', 'Housing', 'سكن'),
  category('shopping', 'Shopping', 'تسوق'),
  category('health', 'Health', 'صحة'),
  category('entertainment', 'Entertainment', 'ترفيه'),
  category('education', 'Education', 'تعليم'),
  category('other', 'Other', 'أخرى'),
] as const);

export type Category = (typeof CATEGORIES)[number];
export type CategoryCode = Category['code'];

export const CATEGORY_CODES: readonly CategoryCode[] = Object.freeze(
  CATEGORIES.map((entry) => entry.code),
);

export function isCategoryCode(value: unknown): value is CategoryCode {
  return typeof value === 'string' && (CATEGORY_CODES as readonly string[]).includes(value);
}
