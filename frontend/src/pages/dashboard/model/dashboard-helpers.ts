import type { CurrencyTotals, FinancialReport, FinanceCurrency } from '../../../entities/finance';
import type { Project, ProjectStatus } from '../../../entities/project';

const inactiveStatuses: ProjectStatus[] = ['completed', 'cancelled'];
const financeCurrencies: FinanceCurrency[] = ['USD', 'CAD'];

function parseDate(value: string | null | undefined) {
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

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function isActiveProject(project: Pick<Project, 'status'>) {
  return !inactiveStatuses.includes(project.status);
}

export function isOverdueProject(project: Pick<Project, 'status' | 'end_date'>, now = new Date()) {
  if (!isActiveProject(project)) {
    return false;
  }

  const endDate = parseDate(project.end_date);

  if (!endDate) {
    return false;
  }

  return endDate.getTime() < startOfDay(now).getTime();
}

export function getProjectStatusCounts(projects: Project[]) {
  return {
    total: projects.length,
    active: projects.filter(isActiveProject).length,
    completed: projects.filter((project) => project.status === 'completed').length,
    highPriority: getHighPriorityProjects(projects).length,
  };
}

export function getHighPriorityProjects(projects: Project[]) {
  return projects.filter((project) => isActiveProject(project) && project.priority === 'high');
}

export function getOverdueProjects(projects: Project[], now = new Date()) {
  return projects.filter((project) => isOverdueProject(project, now));
}

export function getLatestReport(reports: FinancialReport[]) {
  return [...reports]
    .sort((first, second) => (
      (parseDate(second.generated_at)?.getTime() ?? 0) - (parseDate(first.generated_at)?.getTime() ?? 0)
    ))[0] ?? null;
}

export function getFinanceTotalsByCurrency(report: FinancialReport | null | undefined) {
  if (!report?.totals_by_currency) {
    return null;
  }

  return financeCurrencies.reduce((totals, currency) => ({
    ...totals,
    [currency]: report.totals_by_currency[currency] ?? null,
  }), {} as Record<FinanceCurrency, FinancialReport['totals_by_currency'][FinanceCurrency] | null>);
}

export type FinanceBarTone = 'income' | 'expenses' | 'profit' | 'loss';

export type FinanceBar = {
  key: 'income' | 'expenses' | 'net_profit';
  label: string;
  amount: string;
  widthPercent: number;
  tone: FinanceBarTone;
};

// Builds the three bars for one currency block. Bar widths are relative to the largest
// absolute value *within this currency*, so USD and CAD are never scaled against each
// other. Net profit uses a loss tone when negative.
export function getCurrencyBars(totals: CurrencyTotals): FinanceBar[] {
  const income = Number(totals.total_income) || 0;
  const expenses = Number(totals.total_expenses) || 0;
  const netProfit = Number(totals.net_profit) || 0;
  const max = Math.max(Math.abs(income), Math.abs(expenses), Math.abs(netProfit));

  const widthPercent = (value: number) => (
    max > 0 ? Math.round((Math.abs(value) / max) * 100) : 0
  );

  return [
    {
      key: 'income',
      label: 'Income',
      amount: totals.total_income,
      widthPercent: widthPercent(income),
      tone: 'income',
    },
    {
      key: 'expenses',
      label: 'Expenses',
      amount: totals.total_expenses,
      widthPercent: widthPercent(expenses),
      tone: 'expenses',
    },
    {
      key: 'net_profit',
      label: 'Net profit',
      amount: totals.net_profit,
      widthPercent: widthPercent(netProfit),
      tone: netProfit < 0 ? 'loss' : 'profit',
    },
  ];
}
