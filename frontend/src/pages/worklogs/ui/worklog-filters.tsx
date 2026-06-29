import { LayoutGrid, RotateCcw, Search } from 'lucide-react';

type FilterOption = {
  value: string;
  label: string;
};

type WorklogFiltersProps = {
  search: string;
  projectFilter: string;
  teamFilter: string;
  workerFilter: string;
  dateFilter: string;
  projectOptions: FilterOption[];
  teamOptions: FilterOption[];
  workerOptions: FilterOption[];
  isManager: boolean;
  canFilterByWorker: boolean;
  hasActiveFilters: boolean;
  filteredCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onProjectFilterChange: (value: string) => void;
  onTeamFilterChange: (value: string) => void;
  onWorkerFilterChange: (value: string) => void;
  onDateFilterChange: (value: string) => void;
  onReset: () => void;
};

export function WorklogFilters({
  search,
  projectFilter,
  teamFilter,
  workerFilter,
  dateFilter,
  projectOptions,
  teamOptions,
  workerOptions,
  isManager,
  canFilterByWorker,
  hasActiveFilters,
  filteredCount,
  totalCount,
  onSearchChange,
  onProjectFilterChange,
  onTeamFilterChange,
  onWorkerFilterChange,
  onDateFilterChange,
  onReset,
}: WorklogFiltersProps) {
  return (
    <div className="rounded-lg border border-gray-300 bg-white p-3 shadow-md">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex h-10 min-w-[12.5rem] flex-1 items-center gap-2 rounded-md border border-gray-300 px-3 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
          <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Search worklogs"
            className="min-w-0 flex-1 text-sm text-gray-950 outline-none"
            placeholder="Search description, worker, project or team..."
          />
        </div>

        <select
          value={projectFilter}
          onChange={(event) => onProjectFilterChange(event.target.value)}
          aria-label="Filter by project"
          className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">All projects</option>
          {projectOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        {isManager && (
          <select
            value={teamFilter}
            onChange={(event) => onTeamFilterChange(event.target.value)}
            aria-label="Filter by team"
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All teams</option>
            {teamOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        )}

        <input
          value={dateFilter}
          onChange={(event) => onDateFilterChange(event.target.value)}
          aria-label="Filter by date"
          className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          type="date"
        />

        {canFilterByWorker && (
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
        )}

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
          <strong className="font-semibold text-gray-950">{totalCount}</strong> worklogs
        </p>
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          Table view
        </span>
      </div>
    </div>
  );
}
