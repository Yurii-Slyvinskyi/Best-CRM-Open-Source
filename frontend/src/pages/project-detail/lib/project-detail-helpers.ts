import type { ChatMessage } from '../../../entities/chat';
import type { Payment } from '../../../entities/finance';
import type { Project } from '../../../entities/project';

export const priorityDotStyles = {
  high: { dot: 'bg-red-600', label: 'High' },
  medium: { dot: 'bg-orange-500', label: 'Medium' },
  low: { dot: 'bg-green-600', label: 'Low' },
  neutral: { dot: 'bg-gray-400', label: 'Unknown' },
};

export function getPriorityDot(priority: Project['priority'] | string | null) {
  if (priority === 'high' || priority === 'medium' || priority === 'low') {
    return priorityDotStyles[priority];
  }

  return priorityDotStyles.neutral;
}

export function getPaymentTotal(payments: Payment[]) {
  return payments.reduce((total, payment) => {
    const amount = Number(payment.amount);
    return Number.isNaN(amount) ? total : total + amount;
  }, 0);
}

export function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';
}

export function formatMessageTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function getMessageTimestampValue(message: ChatMessage) {
  const date = new Date(message.timestamp);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}
