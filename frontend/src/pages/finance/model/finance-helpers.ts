import type { PaymentStatus, TransactionType } from '../../../entities/finance';

export const transactionTypeOptions: Array<{ value: '' | TransactionType; label: string }> = [
  { value: '', label: 'All types' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
];

export const transactionTypeFormOptions: Array<{ value: TransactionType; label: string }> = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
];

export const paymentStatusOptions: Array<{ value: '' | PaymentStatus; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'failed', label: 'Failed' },
];

export const paymentStatusEditOptions: Array<{ value: PaymentStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'failed', label: 'Failed' },
];

export type SortOrder = 'newest' | 'oldest';

export const sortOptions: Array<{ value: SortOrder; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];

export const transactionTypeClasses: Record<TransactionType, string> = {
  income: 'border-green-200 bg-green-50 text-green-700',
  expense: 'border-amber-200 bg-amber-50 text-amber-700',
};

export const paymentStatusClasses: Record<PaymentStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  confirmed: 'border-green-200 bg-green-50 text-green-700',
  failed: 'border-red-200 bg-red-50 text-red-700',
};

export const formInputClasses = 'mt-2 h-11 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100';

export function sortByDate<T>(items: T[], getDate: (item: T) => string | null, order: SortOrder) {
  return [...items].sort((a, b) => {
    const aTime = new Date(getDate(a) ?? 0).getTime();
    const bTime = new Date(getDate(b) ?? 0).getTime();
    return order === 'newest' ? bTime - aTime : aTime - bTime;
  });
}

export function isPositiveAmount(value: string) {
  const amount = Number(value);
  return !Number.isNaN(amount) && amount > 0;
}

export function parseDate(value: string | null) {
  if (!value) {
    return null;
  }

  let date;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(value);
  }

  return Number.isNaN(date.getTime()) ? null : date;
}
