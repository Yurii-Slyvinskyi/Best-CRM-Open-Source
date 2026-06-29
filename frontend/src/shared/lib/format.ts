type FormattableDate = string | Date | null | undefined;
type FormattableMoney = number | string | null | undefined;

function isEmptyValue(value: FormattableDate | FormattableMoney) {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}

export function formatMoney(amount: FormattableMoney, currency = 'USD') {
  if (isEmptyValue(amount)) {
    return '—';
  }

  const numericAmount = Number(amount);

  if (Number.isNaN(numericAmount)) {
    return typeof amount === 'string'
      ? `${amount} ${currency.toUpperCase()}`
      : '—';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(numericAmount);
}

function parseDate(value: FormattableDate) {
  if (isEmptyValue(value)) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== 'string') {
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

function getInvalidDateFallback(value: FormattableDate) {
  return typeof value === 'string' && value.trim() !== '' ? value : '—';
}

export function formatDate(value: FormattableDate) {
  const date = parseDate(value);

  if (!date) {
    return getInvalidDateFallback(value);
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(value: FormattableDate) {
  const date = parseDate(value);

  if (!date) {
    return getInvalidDateFallback(value);
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}
