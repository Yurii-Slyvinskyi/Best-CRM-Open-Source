import { describe, expect, it } from 'vitest';
import type { CurrencyTotals, FinancialReport } from '../../../entities/finance';
import type { Project } from '../../../entities/project';
import {
  getCurrencyBars,
  getFinanceTotalsByCurrency,
  getHighPriorityProjects,
  getLatestReport,
  getOverdueProjects,
  getProjectStatusCounts,
} from './dashboard-helpers';

function makeProject(overrides: Partial<Project>): Project {
  return {
    id: 1,
    name: 'Project',
    description: '',
    status: 'assigned',
    assigned_team: [],
    client: 1,
    company: 1,
    address: '',
    start_date: null,
    end_date: null,
    priority: 'medium',
    budget: null,
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    blueprint: null,
    chat_room: null,
    ...overrides,
  };
}

function makeReport(overrides: Partial<FinancialReport>): FinancialReport {
  return {
    id: 1,
    company: 1,
    start_date: '2026-06-01',
    end_date: null,
    total_income: '999.00',
    total_expenses: '444.00',
    net_profit: '555.00',
    generated_at: '2026-06-18T10:00:00Z',
    totals_by_currency: {
      USD: {
        total_income: '120.00',
        total_expenses: '20.00',
        net_profit: '100.00',
      },
      CAD: {
        total_income: '240.00',
        total_expenses: '40.00',
        net_profit: '200.00',
      },
    },
    ...overrides,
  };
}

describe('getProjectStatusCounts', () => {
  it('counts active, completed, and active high-priority projects', () => {
    const projects = [
      makeProject({ id: 1, status: 'assigned', priority: 'high' }),
      makeProject({ id: 2, status: 'partially completed', priority: 'medium' }),
      makeProject({ id: 3, status: 'completed', priority: 'high' }),
      makeProject({ id: 4, status: 'cancelled', priority: 'high' }),
    ];

    expect(getProjectStatusCounts(projects)).toEqual({
      total: 4,
      active: 2,
      completed: 1,
      highPriority: 1,
    });
    expect(getHighPriorityProjects(projects).map((project) => project.id)).toEqual([1]);
  });
});

describe('getOverdueProjects', () => {
  it('ignores completed and cancelled projects', () => {
    const now = new Date(2026, 5, 18, 12);
    const projects = [
      makeProject({ id: 1, status: 'assigned', end_date: '2026-06-17' }),
      makeProject({ id: 2, status: 'completed', end_date: '2026-06-16' }),
      makeProject({ id: 3, status: 'cancelled', end_date: '2026-06-16' }),
      makeProject({ id: 4, status: 'assigned', end_date: '2026-06-18' }),
    ];

    expect(getOverdueProjects(projects, now).map((project) => project.id)).toEqual([1]);
  });
});

describe('getLatestReport', () => {
  it('returns the newest report by generated date', () => {
    const reports = [
      makeReport({ id: 1, generated_at: '2026-06-17T10:00:00Z' }),
      makeReport({ id: 2, generated_at: '2026-06-18T10:00:00Z' }),
    ];

    expect(getLatestReport(reports)?.id).toBe(2);
  });
});

describe('getFinanceTotalsByCurrency', () => {
  it('uses totals_by_currency and keeps USD and CAD separate', () => {
    const totals = getFinanceTotalsByCurrency(makeReport({
      total_income: '9999.00',
      total_expenses: '8888.00',
      net_profit: '7777.00',
    }));

    expect(totals?.USD?.net_profit).toBe('100.00');
    expect(totals?.CAD?.net_profit).toBe('200.00');
    expect(totals?.USD?.net_profit).not.toBe(totals?.CAD?.net_profit);
  });

  it('returns null when finance data is unavailable', () => {
    expect(getFinanceTotalsByCurrency(null)).toBeNull();
  });
});

describe('getCurrencyBars', () => {
  function totals(overrides: Partial<CurrencyTotals>): CurrencyTotals {
    return {
      total_income: '100.00',
      total_expenses: '50.00',
      net_profit: '50.00',
      ...overrides,
    };
  }

  it('computes widths relative to the largest absolute value within the currency', () => {
    const bars = getCurrencyBars(totals({
      total_income: '200.00',
      total_expenses: '50.00',
      net_profit: '150.00',
    }));

    expect(bars.map((bar) => [bar.key, bar.widthPercent])).toEqual([
      ['income', 100],
      ['expenses', 25],
      ['net_profit', 75],
    ]);
    expect(bars.map((bar) => bar.amount)).toEqual(['200.00', '50.00', '150.00']);
  });

  it('returns zero widths when all values are zero', () => {
    const bars = getCurrencyBars(totals({
      total_income: '0',
      total_expenses: '0',
      net_profit: '0',
    }));

    expect(bars.every((bar) => bar.widthPercent === 0)).toBe(true);
  });

  it('flags a negative net profit as a loss', () => {
    const bars = getCurrencyBars(totals({
      total_income: '40.00',
      total_expenses: '100.00',
      net_profit: '-60.00',
    }));

    const netBar = bars.find((bar) => bar.key === 'net_profit');
    expect(netBar?.tone).toBe('loss');
    expect(netBar?.widthPercent).toBe(60);
  });
});
