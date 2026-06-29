import type { Worklog, WorklogPayload } from '../../../entities/worklog';

export type WorklogFormValues = {
  worker: string;
  project: string;
  team: string;
  date: string;
  hours_worked: string;
  description: string;
};

export type WorklogFormErrors = Partial<Record<keyof WorklogFormValues, string>>;

function getLocalDateInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getInitialCreateValues(): WorklogFormValues {
  return {
    worker: '',
    project: '',
    team: '',
    date: getLocalDateInputValue(),
    hours_worked: '',
    description: '',
  };
}

export function getInitialEditValues(worklog: Worklog): WorklogFormValues {
  return {
    worker: String(worklog.worker),
    project: String(worklog.project),
    team: String(worklog.team),
    date: worklog.date,
    hours_worked: String(worklog.hours_worked),
    description: worklog.description ?? '',
  };
}

export function formatHours(hours: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(hours);
}

export function buildWorklogPayload(values: WorklogFormValues, isManager: boolean): WorklogPayload {
  return {
    ...(isManager ? { worker: Number(values.worker) } : {}),
    team: Number(values.team),
    project: Number(values.project),
    date: values.date,
    hours_worked: Number(values.hours_worked),
    description: values.description.trim() || null,
  };
}

export function validateWorklogForm(values: WorklogFormValues, isManager: boolean) {
  const nextErrors: WorklogFormErrors = {};
  const hours = Number(values.hours_worked);

  if (isManager && !values.worker) {
    nextErrors.worker = 'Worker is required.';
  }

  if (!values.project) {
    nextErrors.project = 'Project is required.';
  }

  if (!values.team) {
    nextErrors.team = 'Team is required.';
  }

  if (!values.date) {
    nextErrors.date = 'Date is required.';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date)) {
    nextErrors.date = 'Date must use YYYY-MM-DD format.';
  }

  if (!values.hours_worked) {
    nextErrors.hours_worked = 'Hours are required.';
  } else if (!Number.isInteger(hours) || hours <= 0) {
    nextErrors.hours_worked = 'Hours must be a positive integer.';
  }

  return nextErrors;
}
