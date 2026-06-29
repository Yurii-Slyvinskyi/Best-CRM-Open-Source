import { LayoutGrid, RotateCcw, Search } from 'lucide-react';
import {
  priorityOptions,
  statusOptions,
  type FilterOption,
} from '../model/project-filters';

type ProjectFiltersProps = {
  search: string;
  statusFilter: string;
  priorityFilter: string;
  clientFilter: string;
  teamFilter: string;
  canFilterByClient: boolean;
  canFilterByTeam: boolean;
  clientOptions: FilterOption[];
  teamOptions: FilterOption[];
  hasActiveFilters: boolean;
  filteredCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onPriorityFilterChange: (value: string) => void;
  onClientFilterChange: (value: string) => void;
  onTeamFilterChange: (value: string) => void;
  onReset: () => void;
};

export function ProjectFilters({
  search,
  statusFilter,
  priorityFilter,
  clientFilter,
  teamFilter,
  canFilterByClient,
  canFilterByTeam,
  clientOptions,
  teamOptions,
  hasActiveFilters,
  filteredCount,
  totalCount,
  onSearchChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onClientFilterChange,
  onTeamFilterChange,
  onReset,
}: ProjectFiltersProps) {
  return (
    <div className="rounded-lg border border-gray-300 bg-white p-3 shadow-md">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex h-10 min-w-[12.5rem] flex-1 items-center gap-2 rounded-md border border-gray-300 px-3 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
          <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Search projects"
            className="min-w-0 flex-1 text-sm text-gray-950 outline-none"
            placeholder="Search name, description or address…"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value)}
          aria-label="Filter by status"
          className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">All statuses</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(event) => onPriorityFilterChange(event.target.value)}
          aria-label="Filter by priority"
          className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">All priorities</option>
          {priorityOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        {canFilterByClient && (
          <select
            value={clientFilter}
            onChange={(event) => onClientFilterChange(event.target.value)}
            aria-label="Filter by client"
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All clients</option>
            {clientOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        )}

        {canFilterByTeam && (
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
          <strong className="font-semibold text-gray-950">{totalCount}</strong> projects
        </p>
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          Grid view
        </span>
      </div>
    </div>
  );
}
