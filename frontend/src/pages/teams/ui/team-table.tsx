import { Pencil, Trash2 } from 'lucide-react';
import type { Project } from '../../../entities/project';
import type { Team } from '../../../entities/team';
import {
  DataTable,
  DataTableBody,
  DataTableEmptyRow,
  DataTableHeader,
  DataTableShell,
} from '../../../shared/ui/data-table';

type TeamTableProps = {
  teams: Team[];
  pendingDeleteId: number | null;
  deletingId: number | null;
  getWorkerLabel: (workerId: number) => string;
  getProjectName: (project: Project) => string;
  getTeamProjects: (teamId: number) => Project[];
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
  onDeletePrompt: (teamId: number) => void;
  onDeleteCancel: () => void;
};

export function TeamTable({
  teams,
  pendingDeleteId,
  deletingId,
  getWorkerLabel,
  getProjectName,
  getTeamProjects,
  onEdit,
  onDelete,
  onDeletePrompt,
  onDeleteCancel,
}: TeamTableProps) {
  return (
    <DataTableShell>
      <DataTable>
        <DataTableHeader>
          <tr>
            <th className="min-w-[12rem] px-4 py-4">Team</th>
            <th className="min-w-[18rem] px-4 py-4">Workers</th>
            <th className="min-w-[8rem] px-4 py-4">Worker count</th>
            <th className="min-w-[18rem] px-4 py-4">Assigned projects</th>
            <th className="min-w-[14rem] px-4 py-4">Actions</th>
          </tr>
        </DataTableHeader>
        <DataTableBody>
          {teams.length === 0 && (
            <DataTableEmptyRow colSpan={5} message="No teams match the current filters." />
          )}
          {teams.map((team) => {
            const teamProjects = getTeamProjects(team.id);
            const isPendingDelete = pendingDeleteId === team.id;
            const isDeleting = deletingId === team.id;

            return (
              <tr key={team.id}>
                <td className="min-w-[12rem] px-4 py-4 font-semibold text-gray-950">
                  {team.name} <span className="font-normal text-gray-500">#{team.id}</span>
                </td>
                <td className="min-w-[18rem] px-4 py-4">
                  {team.workers.length === 0 ? (
                    <span className="text-gray-500">No workers assigned</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {team.workers.map((workerId) => (
                        <span
                          key={workerId}
                          className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700"
                        >
                          {getWorkerLabel(workerId)}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="min-w-[8rem] px-4 py-4 font-semibold text-gray-950">
                  {team.workers.length}
                </td>
                <td className="min-w-[18rem] px-4 py-4">
                  {teamProjects.length === 0 ? (
                    <span className="text-gray-500">No assigned projects</span>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-950">
                        {teamProjects.length} project{teamProjects.length === 1 ? '' : 's'}
                      </p>
                      <p className="text-sm leading-6 text-gray-600">
                        {teamProjects.map(getProjectName).join(', ')}
                      </p>
                    </div>
                  )}
                </td>
                <td className="min-w-[14rem] px-4 py-4">
                  {isPendingDelete ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-gray-600">Delete team?</span>
                      <button
                        type="button"
                        onClick={() => onDelete(team)}
                        disabled={isDeleting}
                        className="inline-flex h-9 items-center rounded-md bg-red-600 px-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                      >
                        {isDeleting ? 'Deleting...' : 'Confirm'}
                      </button>
                      <button
                        type="button"
                        onClick={onDeleteCancel}
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
                        onClick={() => onEdit(team)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeletePrompt(team.id)}
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
  );
}
