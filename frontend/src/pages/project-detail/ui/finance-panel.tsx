import { CreditCard } from 'lucide-react';
import { formatProjectDate } from '../../../entities/project';
import type { Payment } from '../../../entities/finance';
import {
  DataTable,
  DataTableBody,
  DataTableHeader,
  DataTableShell,
} from '../../../shared/ui/data-table';
import { EmptyState } from '../../../shared/ui/empty-state';
import { ErrorState } from '../../../shared/ui/error-state';
import { LoadingState } from '../../../shared/ui/loading-state';
import { formatMoney } from '../../../shared/lib/format';
import { getPaymentTotal } from '../lib/project-detail-helpers';
import { SectionPanel } from './section-panel';

type FinancePanelProps = {
  payments: Payment[];
  isLoading: boolean;
  error: string;
};

export function FinancePanel({ payments, isLoading, error }: FinancePanelProps) {
  const paymentTotal = getPaymentTotal(payments);

  return (
    <SectionPanel icon={CreditCard} title="Finance">
      {isLoading && <LoadingState title="Loading payments" compact />}
      {!isLoading && error && (
        <ErrorState title="Unable to load payments" message={error} />
      )}
      {!isLoading && !error && payments.length === 0 && (
        <EmptyState
          icon={CreditCard}
          title="No project payments"
          description="No payments are visible for this project in your current finance scope."
          compact
        />
      )}
      {!isLoading && !error && payments.length > 0 && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Payments</p>
              <p className="mt-2 text-lg font-semibold tabular-nums text-gray-950">{payments.length}</p>
            </div>
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Total</p>
              <p className="mt-2 text-lg font-semibold tabular-nums text-gray-950">
                {formatMoney(paymentTotal, payments[0]?.currency ?? 'USD')}
              </p>
            </div>
          </div>
          <DataTableShell>
            <DataTable>
              <DataTableHeader>
                <tr>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </DataTableHeader>
              <DataTableBody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 font-semibold text-gray-950">
                      {formatMoney(payment.amount, payment.currency)}
                    </td>
                    <td className="px-4 py-3 capitalize">{payment.status}</td>
                    <td className="px-4 py-3">{formatProjectDate(payment.created_at)}</td>
                  </tr>
                ))}
              </DataTableBody>
            </DataTable>
          </DataTableShell>
        </div>
      )}
    </SectionPanel>
  );
}
