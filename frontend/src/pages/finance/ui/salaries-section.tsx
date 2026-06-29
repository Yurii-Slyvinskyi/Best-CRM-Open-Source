import { Banknote, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { type Salary } from '../../../entities/finance';
import {
  DataTable,
  DataTableBody,
  DataTableEmptyRow,
  DataTableHeader,
  DataTableShell,
} from '../../../shared/ui/data-table';
import { formatDate, formatMoney } from '../../../shared/lib/format';
import { EmptyState } from '../../../shared/ui/empty-state';
import { sortOptions, type SortOrder } from '../model/finance-helpers';
import { SectionHeader } from './section-header';

type SalariesSectionProps = {
  salaries: Salary[];
  filteredSalaries: Salary[];
  search: string;
  sort: SortOrder;
  pendingDeleteId: number | null;
  deletingId: number | null;
  getWorkerLabel: (workerId: number) => string;
  onSearchChange: (value: string) => void;
  onSortChange: (value: SortOrder) => void;
  onCreate: () => void;
  onEdit: (salary: Salary) => void;
  onRequestDelete: (salary: Salary) => void;
  onConfirmDelete: (salary: Salary) => void;
  onCancelDelete: () => void;
};

export function SalariesSection({
  salaries,
  filteredSalaries,
  search,
  sort,
  pendingDeleteId,
  deletingId,
  getWorkerLabel,
  onSearchChange,
  onSortChange,
  onCreate,
  onEdit,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: SalariesSectionProps) {
  return (
    <section className="space-y-4">
      <SectionHeader
        title="Salaries"
        description="Worker salary payments recorded by managers."
        action={(
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New salary
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
              aria-label="Search salaries"
              className="min-w-0 flex-1 text-sm text-gray-950 outline-none"
              placeholder="Search worker…"
            />
          </div>

          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortOrder)}
            aria-label="Sort salaries by date"
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {salaries.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="No salaries found"
          description="There are no salary payments in your current backend scope yet."
        />
      ) : (
        <DataTableShell>
          <DataTable>
            <DataTableHeader>
              <tr>
                <th className="min-w-[12rem] px-4 py-4">Worker</th>
                <th className="min-w-[10rem] px-4 py-4">Amount</th>
                <th className="min-w-[12rem] px-4 py-4">Date paid</th>
                <th className="min-w-[12rem] px-4 py-4">Actions</th>
              </tr>
            </DataTableHeader>
            <DataTableBody>
              {filteredSalaries.length === 0 && (
                <DataTableEmptyRow colSpan={4} message="No salaries match the current filters." />
              )}
              {filteredSalaries.map((salary) => {
                const isPendingDelete = pendingDeleteId === salary.id;
                const isDeleting = deletingId === salary.id;

                return (
                  <tr key={salary.id}>
                    <td className="min-w-[12rem] break-words px-4 py-4 text-gray-950">
                      {getWorkerLabel(salary.worker)}
                    </td>
                    <td className="min-w-[10rem] px-4 py-4 font-semibold text-gray-950">
                      {formatMoney(salary.amount, salary.currency)}
                    </td>
                    <td className="min-w-[12rem] px-4 py-4">{formatDate(salary.date_paid)}</td>
                    <td className="min-w-[12rem] px-4 py-4">
                      {isPendingDelete ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm text-gray-600">Delete?</span>
                          <button
                            type="button"
                            onClick={() => onConfirmDelete(salary)}
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
                            onClick={() => onEdit(salary)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onRequestDelete(salary)}
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
