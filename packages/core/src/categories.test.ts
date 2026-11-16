import { describe, expect, it } from 'vitest';

import { CATEGORIES, CATEGORY_CODES, isCategoryCode } from './index.js';

describe('categories (FR-014)', () => {
  // FR-014 criteria 1 and 2: the lists as written in the requirement, in order.
  const englishNames = [
    'Food and drink',
    'Groceries',
    'Transport',
    'Bills and utilities',
    'Housing',
    'Shopping',
    'Health',
    'Entertainment',
    'Education',
    'Other',
  ];
  const arabicNames = [
    'طعام ومشروبات',
    'بقالة',
    'مواصلات',
    'فواتير ومرافق',
    'سكن',
    'تسوق',
    'صحة',
    'ترفيه',
    'تعليم',
    'أخرى',
  ];

  it('categories_are_exactly_ten_in_order_en_and_ar', () => {
    expect(CATEGORIES).toHaveLength(10);
    expect(CATEGORIES.map((category) => category.name.en)).toEqual(englishNames);
    expect(CATEGORIES.map((category) => category.name.ar)).toEqual(arabicNames);
  });

  it('category_codes_are_unique_stable_identifiers_in_list_order', () => {
    expect(CATEGORY_CODES).toEqual(CATEGORIES.map((category) => category.code));
    expect(new Set(CATEGORY_CODES).size).toBe(10);
    for (const code of CATEGORY_CODES) {
      expect(code).toMatch(/^[a-z]+(_[a-z]+)*$/);
    }
  });

  it('category_names_contain_no_arabic_indic_digits_and_are_not_empty', () => {
    for (const category of CATEGORIES) {
      expect(category.name.en.trim()).not.toBe('');
      expect(category.name.ar.trim()).not.toBe('');
      expect(category.name.ar).not.toMatch(/[\u0660-\u0669\u06F0-\u06F9]/);
    }
  });

  it('category_list_cannot_be_changed_at_runtime', () => {
    expect(Object.isFrozen(CATEGORIES)).toBe(true);
    expect(Object.isFrozen(CATEGORIES[0])).toBe(true);
    expect(Object.isFrozen(CATEGORIES[0]?.name)).toBe(true);
    expect(Object.isFrozen(CATEGORY_CODES)).toBe(true);
  });

  it('is_category_code_accepts_only_the_ten_codes', () => {
    for (const code of CATEGORY_CODES) {
      expect(isCategoryCode(code)).toBe(true);
    }
    for (const value of [
      '',
      'Groceries',
      'GROCERIES',
      'pets',
      ' groceries',
      'toString',
      5,
      null,
      undefined,
      {},
    ]) {
      expect(isCategoryCode(value)).toBe(false);
    }
  });
});
