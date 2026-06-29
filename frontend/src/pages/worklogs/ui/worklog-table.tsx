import { Pencil, Trash2 } from 'lucide-react';
import type { Project } from '../../../entities/project';
import type { Worklog } from '../../../entities/worklog';
import {
  DataTable,
  DataTableBody,
  DataTableEmptyRow,
  DataTableHeader,
  DataTableShell,
} from '../../../shared/ui/data-table';
import { formatHours } from '../model/worklog-form';

type WorklogTableProps = {
  worklogs: Worklog[];
  projectById: Map<number, Project>;
  savingEditId: number | null;
  deletingWorklogId: number | null;
  getWorkerLabel: (workerId: number) => string;
  getProjectLabel: (projectId: number) => string;
  getTeamLabel: (teamId: number) => string;
  onEdit: (worklog: Worklog) => void;
  onDelete: (worklog: Worklog) => void;
};

export function WorklogTable({
  worklogs,
  projectById,
  savingEditId,
  deletingWorklogId,
  getWorkerLabel,
  getProjectLabel,
  getTeamLabel,
  onEdit,
  onDelete,
}: WorklogTableProps) {
  return (
    <DataTableShell>
      <DataTable>
        <DataTableHeader>
          <tr>
            <th className="min-w-[12rem] px-4 py-4">Worker</th>
            <th className="min-w-[14rem] px-4 py-4">Project</th>
            <th className="min-w-[12rem] px-4 py-4">Team</th>
            <th className="min-w-[10rem] px-4 py-4">Date</th>
            <th className="min-w-[8rem] px-4 py-4">Hours</th>
            <th className="min-w-[18rem] px-4 py-4">Description</th>
            <th className="min-w-[12rem] px-4 py-4">Actions</th>
          </tr>
        </DataTableHeader>
        <DataTableBody>
          {worklogs.length === 0 && (
            <DataTableEmptyRow colSpan={7} message="No worklogs match the selected filters." />
          )}
          {worklogs.map((worklog) => {
            const worklogProject = projectById.get(worklog.project);
            const isCompletedProjectWorklog = worklogProject?.status === 'completed';
            const editDisabled = isCompletedProjectWorklog
              || savingEditId === worklog.id
              || deletingWorklogId === worklog.id;
            const editDisabledReason = isCompletedProjectWorklog
              ? 'Completed project worklogs cannot be edited.'
              : 'Edit worklog';

            return (
              <tr key={worklog.id}>
                <td className="min-w-[12rem] px-4 py-4 font-semibold text-gray-950">
                  {getWorkerLabel(worklog.worker)}
                </td>
                <td className="min-w-[14rem] break-words px-4 py-4">
                  {getProjectLabel(worklog.project)}
                </td>
                <td className="min-w-[12rem] break-words px-4 py-4">
                  {getTeamLabel(worklog.team)}
                </td>
                <td className="min-w-[10rem] px-4 py-4 tabular-nums text-gray-700">
                  {worklog.date}
                </td>
                <td className="min-w-[8rem] px-4 py-4 font-semibold tabular-nums text-gray-950">
                  {formatHours(worklog.hours_worked)}
                </td>
                <td className="min-w-[18rem] break-words px-4 py-4">
                  {worklog.description || 'No description'}
                </td>
                <td className="min-w-[12rem] px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(worklog)}
                      disabled={editDisabled}
                      title={editDisabledReason}
                      aria-label={editDisabledReason}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950 disabled:cursor-not-allowed disabled:text-gray-300"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(worklog)}
                      disabled={deletingWorklogId === worklog.id || savingEditId === worklog.id}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-300"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      {deletingWorklogId === worklog.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </DataTableBody>
      </DataTable>
    </DataTableShell>
  );
}
