import { Banknote } from 'lucide-react';
import { formatProjectBudget } from '../../../entities/project';
import type { Payment } from '../../../entities/finance';
import { formatMoney } from '../../../shared/lib/format';
import { getPaymentTotal } from '../lib/project-detail-helpers';
import { DetailItem } from './detail-item';
import { SectionPanel } from './section-panel';

type BudgetPanelProps = {
  budget: string | null;
  payments: Payment[];
  isPaymentsLoading: boolean;
};

export function BudgetPanel({ budget, payments, isPaymentsLoading }: BudgetPanelProps) {
  const paymentTotal = getPaymentTotal(payments);

  return (
    <SectionPanel icon={Banknote} title="Budget & finance">
      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Project budget</p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-gray-950">
        {formatProjectBudget(budget)}
      </p>
      <div className="mt-4 border-t border-gray-100">
        <DetailItem
          label="Visible payments"
          value={isPaymentsLoading ? 'Loading' : String(payments.length)}
        />
        <DetailItem
          label="Visible total"
          value={formatMoney(paymentTotal, payments[0]?.currency ?? 'USD')}
        />
      </div>
    </SectionPanel>
  );
}
