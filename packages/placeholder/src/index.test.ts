import { describe, expect, it } from 'vitest';

import { sum } from './index.js';

describe('sum', () => {
  it('adds two numbers', () => {
    expect(sum(2, 3)).toBe(5);
  });

  it('returns the other number when one is zero', () => {
    expect(sum(0, 7)).toBe(7);
  });
});
