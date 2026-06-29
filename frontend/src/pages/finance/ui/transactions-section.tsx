import { Pencil, Plus, Receipt, Search, Trash2 } from 'lucide-react';
import { type Transaction } from '../../../entities/finance';
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
  sortOptions,
  transactionTypeClasses,
  transactionTypeOptions,
  type SortOrder,
} from '../model/finance-helpers';
import { SectionHeader } from './section-header';

type TransactionsSectionProps = {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  search: string;
  type: string;
  sort: SortOrder;
  pendingDeleteId: number | null;
  deletingId: number | null;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onSortChange: (value: SortOrder) => void;
  onCreate: () => void;
  onEdit: (transaction: Transaction) => void;
  onRequestDelete: (transaction: Transaction) => void;
  onConfirmDelete: (transaction: Transaction) => void;
  onCancelDelete: () => void;
};

export function TransactionsSection({
  transactions,
  filteredTransactions,
  search,
  type,
  sort,
  pendingDeleteId,
  deletingId,
  onSearchChange,
  onTypeChange,
  onSortChange,
  onCreate,
  onEdit,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: TransactionsSectionProps) {
  return (
    <section className="space-y-4">
      <SectionHeader
        title="Transactions"
        description="Recorded income and expense entries for your company."
        action={(
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New transaction
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
              aria-label="Search transactions"
              className="min-w-0 flex-1 text-sm text-gray-950 outline-none"
              placeholder="Search description…"
            />
          </div>

          <select
            value={type}
            onChange={(event) => onTypeChange(event.target.value)}
            aria-label="Filter by transaction type"
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            {transactionTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortOrder)}
            aria-label="Sort transactions by date"
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No transactions found"
          description="There are no transactions in your current backend scope yet."
        />
      ) : (
        <DataTableShell>
          <DataTable>
            <DataTableHeader>
              <tr>
                <th className="min-w-[8rem] px-4 py-4">Type</th>
                <th className="min-w-[10rem] px-4 py-4">Amount</th>
                <th className="min-w-[18rem] px-4 py-4">Description</th>
                <th className="min-w-[12rem] px-4 py-4">Created at</th>
                <th className="min-w-[12rem] px-4 py-4">Actions</th>
              </tr>
            </DataTableHeader>
            <DataTableBody>
              {filteredTransactions.length === 0 && (
                <DataTableEmptyRow colSpan={5} message="No transactions match the current filters." />
              )}
              {filteredTransactions.map((transaction) => {
                const isPendingDelete = pendingDeleteId === transaction.id;
                const isDeleting = deletingId === transaction.id;

                return (
                  <tr key={transaction.id}>
                    <td className="min-w-[8rem] px-4 py-4">
                      <span className={cn(
                        'inline-flex rounded-md border px-2 py-1 text-xs font-semibold capitalize',
                        transactionTypeClasses[transaction.transaction_type],
                      )}>
                        {transaction.transaction_type}
                      </span>
                    </td>
                    <td className="min-w-[10rem] px-4 py-4 font-semibold text-gray-950">
                      {formatMoney(transaction.amount, transaction.currency)}
                    </td>
                    <td className="min-w-[18rem] break-words px-4 py-4">
                      {transaction.description || '—'}
                    </td>
                    <td className="min-w-[12rem] px-4 py-4">{formatDateTime(transaction.created_at)}</td>
                    <td className="min-w-[12rem] px-4 py-4">
                      {isPendingDelete ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm text-gray-600">Delete?</span>
                          <button
                            type="button"
                            onClick={() => onConfirmDelete(transaction)}
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
                            onClick={() => onEdit(transaction)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onRequestDelete(transaction)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
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
