import { describe, expect, it } from 'vitest';
import { isPositiveAmount, parseDate, sortByDate } from './finance-helpers';

type DatedItem = {
  id: number;
  created_at: string | null;
};

const datedItems: DatedItem[] = [
  { id: 1, created_at: '2026-06-18T10:00:00Z' },
  { id: 2, created_at: '2026-06-20T10:00:00Z' },
  { id: 3, created_at: '2026-06-19T10:00:00Z' },
];

describe('sortByDate', () => {
  it('sorts newest first', () => {
    expect(sortByDate(datedItems, (item) => item.created_at, 'newest').map((item) => item.id)).toEqual([2, 3, 1]);
  });

  it('sorts oldest first', () => {
    expect(sortByDate(datedItems, (item) => item.created_at, 'oldest').map((item) => item.id)).toEqual([1, 3, 2]);
  });

  it('handles null dates as epoch according to current behavior', () => {
    const items = [
      { id: 1, created_at: null },
      { id: 2, created_at: '2026-06-18T10:00:00Z' },
    ];

    expect(sortByDate(items, (item) => item.created_at, 'oldest').map((item) => item.id)).toEqual([1, 2]);
    expect(sortByDate(items, (item) => item.created_at, 'newest').map((item) => item.id)).toEqual([2, 1]);
  });

  it('preserves relative order for invalid dates because comparisons produce NaN', () => {
    const items = [
      { id: 1, created_at: 'not-a-date' },
      { id: 2, created_at: '2026-06-18T10:00:00Z' },
      { id: 3, created_at: 'also-invalid' },
    ];

    expect(sortByDate(items, (item) => item.created_at, 'newest').map((item) => item.id)).toEqual([1, 2, 3]);
  });
});

describe('isPositiveAmount', () => {
  it('accepts positive numeric values', () => {
    expect(isPositiveAmount('1')).toBe(true);
    expect(isPositiveAmount('1.5')).toBe(true);
  });

  it('rejects zero, negative, and non-numeric values', () => {
    expect(isPositiveAmount('0')).toBe(false);
    expect(isPositiveAmount('-1')).toBe(false);
    expect(isPositiveAmount('abc')).toBe(false);
  });
});

describe('parseDate', () => {
  it('parses date-only values in local date form', () => {
    const date = parseDate('2026-06-18');

    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(5);
    expect(date?.getDate()).toBe(18);
  });

  it('returns null for empty or invalid values', () => {
    expect(parseDate(null)).toBeNull();
    expect(parseDate('')).toBeNull();
    expect(parseDate('not-a-date')).toBeNull();
  });
});
