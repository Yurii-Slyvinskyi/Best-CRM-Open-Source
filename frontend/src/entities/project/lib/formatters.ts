import { formatDate, formatMoney } from '../../../shared/lib/format';

export function formatProjectBudget(budget: string | null) {
  if (!budget) {
    return 'Not set';
  }

  const amount = Number(budget);

  if (Number.isNaN(amount)) {
    return budget;
  }

  return formatMoney(amount);
}

export function formatProjectDate(value: string | null) {
  if (!value) {
    return 'Not set';
  }

  return formatDate(value);
}

export function formatProjectIds(ids: number[]) {
  if (!ids.length) {
    return 'None';
  }

  return ids.map((id) => `#${id}`).join(', ');
}
