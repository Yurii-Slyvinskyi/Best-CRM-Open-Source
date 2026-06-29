import { LayoutGrid } from 'lucide-react';
import type { UserRole } from '../../../entities/user';
import { roleFilterOptions } from '../model/users-helpers';

type UsersDirectoryHeaderProps = {
  roleFilter: 'all' | UserRole;
  showCounts: boolean;
  filteredCount: number;
  totalCount: number;
  onRoleFilterChange: (value: 'all' | UserRole) => void;
};

export function UsersDirectoryHeader({
  roleFilter,
  showCounts,
  filteredCount,
  totalCount,
  onRoleFilterChange,
}: UsersDirectoryHeaderProps) {
  return (
    <div className="rounded-lg border border-gray-300 bg-white p-3 shadow-md">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-950">Company users</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Managers can review company users and update worker/client roles.
          </p>
        </div>
        <label className="block md:w-56">
          <span className="text-sm font-medium text-gray-700">Role filter</span>
          <select
            value={roleFilter}
            onChange={(event) => onRoleFilterChange(event.target.value as 'all' | UserRole)}
            className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            {roleFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      {showCounts && (
        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
          <p className="text-sm text-gray-600">
            Showing <strong className="font-semibold text-gray-950">{filteredCount}</strong> of{' '}
            <strong className="font-semibold text-gray-950">{totalCount}</strong> users
          </p>
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            Directory
          </span>
        </div>
      )}
    </div>
  );
}
