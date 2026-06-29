import { describe, expect, it } from 'vitest';
import type { ChatMessage } from '../../../entities/chat';
import type { Payment } from '../../../entities/finance';
import {
  formatMessageTimestamp,
  getInitials,
  getMessageTimestampValue,
  getPaymentTotal,
  getPriorityDot,
  priorityDotStyles,
} from './project-detail-helpers';

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 1,
    company: 1,
    project: 10,
    amount: '100.50',
    client: 20,
    manager: 30,
    status: 'pending',
    currency: 'USD',
    created_at: '2026-06-18T10:00:00Z',
    session_id: null,
    session_url: null,
    ...overrides,
  };
}

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 1,
    room: 10,
    sender_username: 'worker_one',
    content: 'Status update',
    timestamp: '2026-06-18T10:00:00Z',
    ...overrides,
  };
}

describe('project-detail helpers', () => {
  it('returns priority labels for known and unknown priorities', () => {
    expect(getPriorityDot('high')).toBe(priorityDotStyles.high);
    expect(getPriorityDot('medium')).toBe(priorityDotStyles.medium);
    expect(getPriorityDot('low')).toBe(priorityDotStyles.low);
    expect(getPriorityDot(null)).toBe(priorityDotStyles.neutral);
    expect(getPriorityDot('urgent')).toBe(priorityDotStyles.neutral);
  });

  it('totals valid payment amounts and ignores invalid amounts', () => {
    expect(getPaymentTotal([
      makePayment({ amount: '100.50' }),
      makePayment({ amount: '200' }),
      makePayment({ amount: 'not-a-number' }),
    ])).toBe(300.5);
  });

  it('derives initials according to current behavior', () => {
    expect(getInitials('Jane Client')).toBe('JC');
    expect(getInitials(' single ')).toBe('S');
    expect(getInitials('')).toBe('?');
    expect(getInitials('mary ann client')).toBe('MA');
  });

  it('preserves invalid timestamp text and provides sortable timestamp values', () => {
    expect(formatMessageTimestamp('not-a-date')).toBe('not-a-date');
    expect(getMessageTimestampValue(makeMessage({ timestamp: '2026-06-18T10:00:00Z' }))).toBe(
      new Date('2026-06-18T10:00:00Z').getTime(),
    );
    expect(getMessageTimestampValue(makeMessage({ timestamp: 'not-a-date' }))).toBe(0);
  });
});
