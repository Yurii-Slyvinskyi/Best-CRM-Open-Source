import { CalendarClock, CircleDollarSign, RefreshCw, Wallet } from 'lucide-react';
import {
  financeCurrencyOptions,
  type CurrencyTotals,
  type FinanceCurrency,
  type FinancialReport,
} from '../../../entities/finance';
import { cn } from '../../../shared/lib/cn';
import { formatDateTime, formatMoney } from '../../../shared/lib/format';
import { MetricCard } from '../../../shared/ui/metric-card';
import { SectionHeader } from './section-header';

type CurrencySummaryCardProps = {
  currency: FinanceCurrency;
  totals: CurrencyTotals;
};

function CurrencySummaryCard({ currency, totals }: CurrencySummaryCardProps) {
  const netProfit = Number(totals.net_profit);

  return (
    <div className="rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
        <Wallet className="h-4 w-4 text-blue-700" aria-hidden="true" />
        {currency} summary
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-gray-600">Income</dt>
          <dd className="font-semibold text-green-700">{formatMoney(totals.total_income, currency)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-gray-600">Expenses</dt>
          <dd className="font-semibold text-red-700">{formatMoney(totals.total_expenses, currency)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-2">
          <dt className="text-gray-600">Net profit</dt>
          <dd className={cn('font-semibold', netProfit < 0 ? 'text-red-700' : 'text-gray-950')}>
            {formatMoney(totals.net_profit, currency)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

type SummarySectionProps = {
  latestReport: FinancialReport | null;
  isRefreshing: boolean;
  onRefresh: () => void;
};

export function SummarySection({ latestReport, isRefreshing, onRefresh }: SummarySectionProps) {
  const refreshButton = (
    <button
      type="button"
      onClick={onRefresh}
      disabled={isRefreshing}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
    >
      <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} aria-hidden="true" />
      {isRefreshing ? 'Refreshing...' : 'Refresh summary'}
    </button>
  );

  return (
    <section className="space-y-4">
      <SectionHeader
        title="Company summary"
        description="Latest generated financial report for your company."
        action={latestReport ? refreshButton : undefined}
      />

      {latestReport ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {financeCurrencyOptions.map((code) => (
            <CurrencySummaryCard
              key={code}
              currency={code}
              totals={latestReport.totals_by_currency[code]}
            />
          ))}
          <MetricCard
            variant="inline"
            icon={CalendarClock}
            label="Generated at"
            value={formatDateTime(latestReport.generated_at)}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-blue-700">
              <CircleDollarSign className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-gray-950">No financial report yet</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
                Generate a financial report to see total income, expenses, and net profit for your company.
              </p>
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} aria-hidden="true" />
                {isRefreshing ? 'Refreshing...' : 'Refresh summary'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
