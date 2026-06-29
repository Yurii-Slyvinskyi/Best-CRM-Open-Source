import { CheckCheck, RotateCcw, Search } from 'lucide-react';
import { FormError } from '../../../shared/ui/form';
import { emailStatusOptions } from '../lib/notifications-helpers';

type NotificationToolbarProps = {
  search: string;
  emailStatusFilter: string;
  dateFilter: string;
  hasActiveFilters: boolean;
  filteredCount: number;
  totalCount: number;
  unreadCount: number;
  isMarkingAll: boolean;
  actionError: string;
  onSearchChange: (value: string) => void;
  onEmailStatusChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onReset: () => void;
  onMarkAllAsRead: () => void;
};

export function NotificationToolbar({
  search,
  emailStatusFilter,
  dateFilter,
  hasActiveFilters,
  filteredCount,
  totalCount,
  unreadCount,
  isMarkingAll,
  actionError,
  onSearchChange,
  onEmailStatusChange,
  onDateChange,
  onReset,
  onMarkAllAsRead,
}: NotificationToolbarProps) {
  return (
    <div className="rounded-lg border border-gray-300 bg-white p-3 shadow-md">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex h-10 min-w-[12.5rem] flex-1 items-center gap-2 rounded-md border border-gray-300 px-3 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
          <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm text-gray-950 outline-none placeholder:text-gray-400"
            placeholder="Search subject or message"
          />
        </div>

        <select
          value={emailStatusFilter}
          onChange={(event) => onEmailStatusChange(event.target.value)}
          className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        >
          {emailStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <input
          value={dateFilter}
          onChange={(event) => onDateChange(event.target.value)}
          className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          type="date"
        />

        <button
          type="button"
          onClick={onReset}
          disabled={!hasActiveFilters}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-transparent px-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
        <p className="text-sm text-gray-600">
          Showing <strong className="font-semibold text-gray-950">{filteredCount}</strong> of{' '}
          <strong className="font-semibold text-gray-950">{totalCount}</strong> notifications
        </p>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              disabled={isMarkingAll}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-700 px-3 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
              {isMarkingAll ? 'Marking…' : 'Mark all as read'}
            </button>
          )}
          <span className="text-xs text-gray-400">Newest first</span>
        </div>
      </div>

      {actionError && (
        <div className="mt-3">
          <FormError message={actionError} />
        </div>
      )}
    </div>
  );
}
