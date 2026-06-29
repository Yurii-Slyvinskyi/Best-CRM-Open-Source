import { CircleDollarSign, Wallet } from 'lucide-react';
import type { CurrencyTotals, FinanceCurrency } from '../../../entities/finance';
import { formatDateTime, formatMoney } from '../../../shared/lib/format';
import { EmptyState } from '../../../shared/ui/empty-state';
import { cn } from '../../../shared/lib/cn';
import { getCurrencyBars, type FinanceBarTone } from '../model/dashboard-helpers';

type FinanceSummaryProps = {
  totalsByCurrency: Record<FinanceCurrency, CurrencyTotals | null> | null;
  generatedAt?: string | null;
  isUnavailable?: boolean;
};

const barToneClasses: Record<FinanceBarTone, string> = {
  income: 'bg-green-600',
  expenses: 'bg-red-500',
  profit: 'bg-blue-600',
  loss: 'bg-red-600',
};

const amountToneClasses: Record<FinanceBarTone, string> = {
  income: 'text-green-700',
  expenses: 'text-red-700',
  profit: 'text-gray-950',
  loss: 'text-red-700',
};

function CurrencyChart({ currency, totals }: { currency: FinanceCurrency; totals: CurrencyTotals }) {
  const bars = getCurrencyBars(totals);

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
        <Wallet className="h-4 w-4 text-blue-700" aria-hidden="true" />
        {currency}
      </div>
      <dl className="mt-3 space-y-3">
        {bars.map((bar) => (
          <div key={bar.key}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <dt className="text-gray-600">{bar.label}</dt>
              <dd className={cn('font-semibold tabular-nums', amountToneClasses[bar.tone])}>
                {formatMoney(bar.amount, currency)}
              </dd>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-200" aria-hidden="true">
              <div
                className={cn('h-full rounded-full', barToneClasses[bar.tone])}
                style={{ width: `${bar.widthPercent}%` }}
              />
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function FinanceSummary({
  totalsByCurrency,
  generatedAt,
  isUnavailable = false,
}: FinanceSummaryProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-gray-950">Finance summary</h2>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          Latest generated income, expenses, and net profit by currency.
        </p>
      </div>

      {isUnavailable && !totalsByCurrency && (
        <div className="mt-4">
          <EmptyState
            compact
            icon={CircleDollarSign}
            title="Finance data unavailable"
            description="The dashboard can still be used while finance reports are unavailable."
          />
        </div>
      )}

      {!isUnavailable && !totalsByCurrency && (
        <div className="mt-4">
          <EmptyState
            compact
            icon={CircleDollarSign}
            title="No finance report"
            description="A generated finance report is needed before totals can be shown."
          />
        </div>
      )}

      {totalsByCurrency && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(['USD', 'CAD'] as FinanceCurrency[]).map((currency) => {
            const totals = totalsByCurrency[currency];

            return totals ? (
              <CurrencyChart key={currency} currency={currency} totals={totals} />
            ) : (
              <div key={currency} className="rounded-md border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                  <Wallet className="h-4 w-4 text-blue-700" aria-hidden="true" />
                  {currency}
                </div>
                <p className="mt-3 text-sm text-gray-500">No {currency} totals in the latest report.</p>
              </div>
            );
          })}
        </div>
      )}

      {generatedAt && (
        <p className="mt-4 text-xs text-gray-500">Generated {formatDateTime(generatedAt)}</p>
      )}
    </section>
  );
}
