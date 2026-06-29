import { CreditCard, ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { type Payment, type PaymentStatus } from '../../../entities/finance';
import { cn } from '../../../shared/lib/cn';
import { formatDateTime, formatMoney } from '../../../shared/lib/format';
import {
  DataTable,
  DataTableBody,
  DataTableEmptyRow,
  DataTableHeader,
  DataTableShell,
} from '../../../shared/ui/data-table';
import { EmptyState } from '../../../shared/ui/empty-state';
import {
  paymentStatusClasses,
  paymentStatusEditOptions,
  paymentStatusOptions,
  sortOptions,
  type SortOrder,
} from '../model/finance-helpers';
import { SectionHeader } from './section-header';

type PaymentsSectionProps = {
  payments: Payment[];
  filteredPayments: Payment[];
  search: string;
  status: string;
  sort: SortOrder;
  pendingDeleteId: number | null;
  deletingId: number | null;
  getClientLabel: (clientId: number) => string;
  getProjectLabel: (projectId: number) => string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSortChange: (value: SortOrder) => void;
  onCreate: () => void;
  onEdit: (payment: Payment) => void;
  onChangeStatus: (payment: Payment, status: PaymentStatus) => void;
  onRequestDelete: (payment: Payment) => void;
  onConfirmDelete: (payment: Payment) => void;
  onCancelDelete: () => void;
};

export function PaymentsSection({
  payments,
  filteredPayments,
  search,
  status,
  sort,
  pendingDeleteId,
  deletingId,
  getClientLabel,
  getProjectLabel,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onCreate,
  onEdit,
  onChangeStatus,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: PaymentsSectionProps) {
  return (
    <section className="space-y-4">
      <SectionHeader
        title="Payments"
        description="Client payments issued by managers across company projects."
        action={(
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New payment
          </button>
        )}
      />

      <div className="rounded-lg border border-gray-300 bg-white p-3 shadow-md">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex h-10 min-w-[12.5rem] flex-1 items-center gap-2 rounded-md border border-gray-300 px-3 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
            <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              aria-label="Search payments"
              className="min-w-0 flex-1 text-sm text-gray-950 outline-none"
              placeholder="Search client or project…"
            />
          </div>

          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            aria-label="Filter by payment status"
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            {paymentStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortOrder)}
            aria-label="Sort payments by date"
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments found"
          description="There are no client payments in your current backend scope yet."
        />
      ) : (
        <DataTableShell>
          <DataTable>
            <DataTableHeader>
              <tr>
                <th className="min-w-[12rem] px-4 py-4">Client</th>
                <th className="min-w-[14rem] px-4 py-4">Project</th>
                <th className="min-w-[10rem] px-4 py-4">Amount</th>
                <th className="min-w-[8rem] px-4 py-4">Status</th>
                <th className="min-w-[12rem] px-4 py-4">Created at</th>
                <th className="min-w-[10rem] px-4 py-4">Checkout</th>
                <th className="min-w-[12rem] px-4 py-4">Actions</th>
              </tr>
            </DataTableHeader>
            <DataTableBody>
              {filteredPayments.length === 0 && (
                <DataTableEmptyRow colSpan={7} message="No payments match the current filters." />
              )}
              {filteredPayments.map((payment) => {
                const isPendingDelete = pendingDeleteId === payment.id;
                const isDeleting = deletingId === payment.id;

                return (
                  <tr key={payment.id}>
                    <td className="min-w-[12rem] break-words px-4 py-4 text-gray-950">
                      {getClientLabel(payment.client)}
                    </td>
                    <td className="min-w-[14rem] break-words px-4 py-4">{getProjectLabel(payment.project)}</td>
                    <td className="min-w-[10rem] px-4 py-4 font-semibold text-gray-950">
                      {formatMoney(payment.amount, payment.currency)}
                    </td>
                    <td className="min-w-[8rem] px-4 py-4">
                      {payment.status === 'confirmed' ? (
                        <span className={cn(
                          'inline-flex rounded-md border px-2 py-1 text-xs font-semibold capitalize',
                          paymentStatusClasses[payment.status],
                        )}>
                          {payment.status}
                        </span>
                      ) : (
                        <select
                          value={payment.status}
                          onChange={(event) => onChangeStatus(payment, event.target.value as PaymentStatus)}
                          aria-label="Change payment status"
                          className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        >
                          {paymentStatusEditOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="min-w-[12rem] px-4 py-4">{formatDateTime(payment.created_at)}</td>
                    <td className="min-w-[10rem] px-4 py-4">
                      {payment.session_url ? (
                        <a
                          href={payment.session_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 transition hover:text-blue-800"
                        >
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          Open
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="min-w-[12rem] px-4 py-4">
                      {isPendingDelete ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm text-gray-600">Delete?</span>
                          <button
                            type="button"
                            onClick={() => onConfirmDelete(payment)}
                            disabled={isDeleting}
                            className="inline-flex h-9 items-center rounded-md bg-red-600 px-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                          >
                            {isDeleting ? 'Deleting...' : 'Confirm'}
                          </button>
                          <button
                            type="button"
                            onClick={onCancelDelete}
                            disabled={isDeleting}
                            className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onEdit(payment)}
                            disabled={payment.status !== 'pending'}
                            title={payment.status !== 'pending' ? 'Only pending payments can be edited' : undefined}
                            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-white"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onRequestDelete(payment)}
                            disabled={payment.status === 'confirmed'}
                            title={payment.status === 'confirmed' ? 'Confirmed payments cannot be deleted' : undefined}
                            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300 disabled:hover:bg-white"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </DataTableBody>
          </DataTable>
        </DataTableShell>
      )}
    </section>
  );
}
