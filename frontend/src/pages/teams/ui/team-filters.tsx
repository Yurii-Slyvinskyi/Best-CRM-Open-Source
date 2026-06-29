import { LayoutGrid, RotateCcw, Search } from 'lucide-react';

type FilterOption = {
  value: string;
  label: string;
};

type TeamFiltersProps = {
  search: string;
  workerFilter: string;
  workerOptions: FilterOption[];
  hasActiveFilters: boolean;
  filteredCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onWorkerFilterChange: (value: string) => void;
  onReset: () => void;
};

export function TeamFilters({
  search,
  workerFilter,
  workerOptions,
  hasActiveFilters,
  filteredCount,
  totalCount,
  onSearchChange,
  onWorkerFilterChange,
  onReset,
}: TeamFiltersProps) {
  return (
    <div className="rounded-lg border border-gray-300 bg-white p-3 shadow-md">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex h-10 min-w-[12.5rem] flex-1 items-center gap-2 rounded-md border border-gray-300 px-3 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
          <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Search teams"
            className="min-w-0 flex-1 text-sm text-gray-950 outline-none"
            placeholder="Search team, worker or project…"
          />
        </div>

        <select
          value={workerFilter}
          onChange={(event) => onWorkerFilterChange(event.target.value)}
          aria-label="Filter by worker"
          className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">All workers</option>
          {workerOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

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
          <strong className="font-semibold text-gray-950">{totalCount}</strong> teams
        </p>
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          Directory
        </span>
      </div>
    </div>
  );
}
