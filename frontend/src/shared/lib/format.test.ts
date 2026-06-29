import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, formatMoney } from './format';

describe('formatMoney', () => {
  it('formats numbers as currency', () => {
    expect(formatMoney(1234.5)).toBe('$1,234.50');
  });

  it('formats numeric strings as currency', () => {
    expect(formatMoney('1234.5', 'cad')).toBe('CA$1,234.50');
  });

  it('returns a dash for empty values', () => {
    expect(formatMoney('')).toBe('—');
    expect(formatMoney('   ')).toBe('—');
    expect(formatMoney(null)).toBe('—');
    expect(formatMoney(undefined)).toBe('—');
  });

  it('does not render NaN for invalid values', () => {
    const formatted = formatMoney('not-a-number', 'usd');

    expect(formatted).toBe('not-a-number USD');
    expect(formatted).not.toContain('NaN');
  });
});

describe('formatDate', () => {
  it('formats a valid date', () => {
    expect(formatDate('2026-06-18')).toBe('Jun 18, 2026');
  });

  it('returns a dash for empty values', () => {
    expect(formatDate('')).toBe('—');
    expect(formatDate('   ')).toBe('—');
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });

  it('does not render Invalid Date for invalid values', () => {
    const formatted = formatDate('not-a-date');

    expect(formatted).toBe('not-a-date');
    expect(formatted).not.toContain('Invalid Date');
  });

  it('does not shift date-only values because of timezone', () => {
    expect(formatDate('2026-06-18')).toBe('Jun 18, 2026');
  });
});

describe('formatDateTime', () => {
  it('formats a valid date and time', () => {
    expect(formatDateTime('2026-06-18T14:30:00')).toContain('Jun 18, 2026');
    expect(formatDateTime('2026-06-18T14:30:00')).toContain('2:30 PM');
  });

  it('returns a dash for empty values', () => {
    expect(formatDateTime('')).toBe('—');
    expect(formatDateTime('   ')).toBe('—');
    expect(formatDateTime(null)).toBe('—');
    expect(formatDateTime(undefined)).toBe('—');
  });

  it('does not render Invalid Date for invalid values', () => {
    const formatted = formatDateTime('not-a-date');

    expect(formatted).toBe('not-a-date');
    expect(formatted).not.toContain('Invalid Date');
  });

  it('does not shift date-only values because of timezone', () => {
    expect(formatDateTime('2026-06-18')).toContain('Jun 18, 2026');
  });
});
