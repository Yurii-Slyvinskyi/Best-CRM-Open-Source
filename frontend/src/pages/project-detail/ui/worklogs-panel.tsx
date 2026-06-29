import { ClipboardList } from 'lucide-react';
import type { Team } from '../../../entities/team';
import type { UserProfile } from '../../../entities/user';
import type { Worklog } from '../../../entities/worklog';
import {
  DataTable,
  DataTableBody,
  DataTableHeader,
  DataTableShell,
} from '../../../shared/ui/data-table';
import { EmptyState } from '../../../shared/ui/empty-state';
import { ErrorState } from '../../../shared/ui/error-state';
import { LoadingState } from '../../../shared/ui/loading-state';
import { SectionPanel } from './section-panel';

type WorklogsPanelProps = {
  worklogs: Worklog[];
  users: UserProfile[];
  teams: Team[];
  isLoading: boolean;
  error: string;
};

export function WorklogsPanel({ worklogs, users, teams, isLoading, error }: WorklogsPanelProps) {
  return (
    <SectionPanel icon={ClipboardList} title="Worklogs">
      {isLoading && <LoadingState title="Loading worklogs" compact />}
      {!isLoading && error && (
        <ErrorState title="Unable to load worklogs" message={error} />
      )}
      {!isLoading && !error && worklogs.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No worklogs yet"
          description="No worklog entries are visible for this project."
          compact
        />
      )}
      {!isLoading && !error && worklogs.length > 0 && (
        <DataTableShell>
          <DataTable>
            <DataTableHeader>
              <tr>
                <th className="px-4 py-3">Worker</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </DataTableHeader>
            <DataTableBody>
              {worklogs.map((worklog) => (
                <tr key={worklog.id}>
                  <td className="px-4 py-3 font-semibold text-gray-950">
                    {users.find((currentUser) => currentUser.id === worklog.worker)?.username ?? `Worker #${worklog.worker}`}
                  </td>
                  <td className="px-4 py-3">
                    {teams.find((team) => team.id === worklog.team)?.name ?? `Team #${worklog.team}`}
                  </td>
                  <td className="px-4 py-3">{worklog.hours_worked}</td>
                  <td className="px-4 py-3">{worklog.description || 'No description'}</td>
                </tr>
              ))}
            </DataTableBody>
          </DataTable>
        </DataTableShell>
      )}
    </SectionPanel>
  );
}
