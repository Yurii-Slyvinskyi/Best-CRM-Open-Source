import { useCallback, useEffect, useMemo, useState } from 'react';
import { Banknote, CalendarClock, ReceiptText, Search, Wallet } from 'lucide-react';
import { getWorkerSalaries, type Salary } from '../../entities/finance';
import { getApiErrorMessage } from '../../shared/api';
import { formatDate, formatMoney } from '../../shared/lib/format';
import {
  DataTable,
  DataTableBody,
  DataTableEmptyRow,
  DataTableHeader,
  DataTableShell,
} from '../../shared/ui/data-table';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { LoadingState } from '../../shared/ui/loading-state';
import { MetricCard } from '../../shared/ui/metric-card';
import { PageShell } from '../../shared/ui/page-shell';

function parseDate(value: string | null) {
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

export function SalariesPage() {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadSalaries = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await getWorkerSalaries();
      setSalaries(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Salaries could not be loaded. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSalaries();
  }, [loadSalaries]);

  function getManagerLabel(managerId: number) {
    return `Manager #${managerId}`;
  }

  const summary = useMemo(() => {
    const totalPaid = salaries.reduce((total, salary) => {
      const amount = Number(salary.amount);
      return Number.isNaN(amount) ? total : total + amount;
    }, 0);

    const latestDate = salaries.reduce<Date | null>((latest, salary) => {
      const date = parseDate(salary.date_paid);

      if (!date) {
        return latest;
      }

      return !latest || date.getTime() > latest.getTime() ? date : latest;
    }, null);

    return {
      totalPaid,
      count: salaries.length,
      currency: salaries[0]?.currency ?? 'USD',
      latestDate,
    };
  }, [salaries]);

  const filteredSalaries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return salaries;
    }

    return salaries.filter((salary) => [
      salary.amount,
      salary.date_paid,
      formatDate(salary.date_paid),
      getManagerLabel(salary.manager),
    ].some((value) => value.toLowerCase().includes(normalizedSearch)));
  }, [salaries, search]);

  return (
    <PageShell
      eyebrow="CRM SALARIES"
      title="Salaries"
      subtitle="Your salary history, amounts, and pay dates."
      width="wide"
    >
      {isLoading && (
        <LoadingState
          title="Loading salaries"
          description="Fetching your salary history."
        />
      )}

      {!isLoading && error && (
        <ErrorState title="Unable to load salaries" message={error} />
      )}

      {!isLoading && !error && salaries.length === 0 && (
        <EmptyState
          icon={ReceiptText}
          title="No salaries found"
          description="You do not have any salary records in your current scope yet."
        />
      )}

      {!isLoading && !error && salaries.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              variant="inline"
              icon={Wallet}
              label="Total paid"
              value={formatMoney(summary.totalPaid, summary.currency)}
            />
            <MetricCard
              variant="inline"
              icon={Banknote}
              label="Salary count"
              value={String(summary.count)}
            />
            <MetricCard
              variant="inline"
              icon={CalendarClock}
              label="Latest payment"
              value={summary.latestDate ? formatDate(summary.latestDate.toISOString().slice(0, 10)) : '—'}
            />
          </div>

          <div className="rounded-lg border border-gray-300 bg-white p-3 shadow-md">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex h-10 min-w-[12.5rem] flex-1 items-center gap-2 rounded-md border border-gray-300 px-3 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
                <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search salaries"
                  className="min-w-0 flex-1 text-sm text-gray-950 outline-none"
                  placeholder="Search amount, date or manager…"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
              <p className="text-sm text-gray-600">
                Showing <strong className="font-semibold text-gray-950">{filteredSalaries.length}</strong> of{' '}
                <strong className="font-semibold text-gray-950">{salaries.length}</strong> salaries
              </p>
            </div>
          </div>

          <DataTableShell>
            <DataTable>
              <DataTableHeader>
                <tr>
                  <th className="min-w-[10rem] px-4 py-4">Amount</th>
                  <th className="min-w-[8rem] px-4 py-4">Currency</th>
                  <th className="min-w-[12rem] px-4 py-4">Date paid</th>
                  <th className="min-w-[12rem] px-4 py-4">Manager</th>
                </tr>
              </DataTableHeader>
              <DataTableBody>
                {filteredSalaries.length === 0 && (
                  <DataTableEmptyRow colSpan={4} message="No salaries match the current search." />
                )}
                {filteredSalaries.map((salary) => (
                  <tr key={salary.id}>
                    <td className="min-w-[10rem] px-4 py-4 font-semibold text-gray-950">
                      {formatMoney(Number(salary.amount), salary.currency)}
                    </td>
                    <td className="min-w-[8rem] px-4 py-4 uppercase">{salary.currency}</td>
                    <td className="min-w-[12rem] px-4 py-4">{formatDate(salary.date_paid)}</td>
                    <td className="min-w-[12rem] px-4 py-4">{getManagerLabel(salary.manager)}</td>
                  </tr>
                ))}
              </DataTableBody>
            </DataTable>
          </DataTableShell>
        </div>
      )}
    </PageShell>
  );
}
