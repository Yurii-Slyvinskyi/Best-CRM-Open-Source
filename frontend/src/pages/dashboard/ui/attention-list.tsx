import { AlertTriangle, Bell, CalendarClock } from 'lucide-react';
import {
  ProjectPriorityBadge,
  ProjectStatusBadge,
  formatProjectDate,
  type Project,
} from '../../../entities/project';
import { EmptyState } from '../../../shared/ui/empty-state';

type AttentionListProps = {
  highPriorityProjects: Project[];
  overdueProjects: Project[];
  unreadNotificationsCount: number;
};

type ProjectRowProps = {
  project: Project;
  reason: string;
};

function ProjectRow({ project, reason }: ProjectRowProps) {
  return (
    <li className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-gray-950">{project.name}</p>
          <p className="mt-1 text-xs text-gray-500">
            {reason}
            {project.end_date ? ` - Due ${formatProjectDate(project.end_date)}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <ProjectStatusBadge status={project.status} />
          <ProjectPriorityBadge priority={project.priority} />
        </div>
      </div>
    </li>
  );
}

export function AttentionList({
  highPriorityProjects,
  overdueProjects,
  unreadNotificationsCount,
}: AttentionListProps) {
  const hasAttentionItems = highPriorityProjects.length > 0
    || overdueProjects.length > 0
    || unreadNotificationsCount > 0;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-amber-700">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-950">Needs attention</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Active project risks and unread notifications in your scope.
          </p>
        </div>
      </div>

      {!hasAttentionItems && (
        <div className="mt-4">
          <EmptyState
            compact
            icon={AlertTriangle}
            title="No immediate attention items"
            description="There are no overdue projects, active high-priority projects, or unread notifications."
          />
        </div>
      )}

      {hasAttentionItems && (
        <div className="mt-4 space-y-4">
          {unreadNotificationsCount > 0 && (
            <div className="flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50 p-3">
              <Bell className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-blue-950">
                  {unreadNotificationsCount} unread notification{unreadNotificationsCount === 1 ? '' : 's'}
                </p>
                <p className="mt-1 text-xs text-blue-800">Review recent operational updates.</p>
              </div>
            </div>
          )}

          {overdueProjects.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                <CalendarClock className="h-4 w-4 text-red-700" aria-hidden="true" />
                Overdue active projects
              </div>
              <ul className="space-y-2">
                {overdueProjects.slice(0, 5).map((project) => (
                  <ProjectRow key={project.id} project={project} reason="Past planned end date" />
                ))}
              </ul>
            </div>
          )}

          {highPriorityProjects.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                <AlertTriangle className="h-4 w-4 text-amber-700" aria-hidden="true" />
                Active high priority
              </div>
              <ul className="space-y-2">
                {highPriorityProjects.slice(0, 5).map((project) => (
                  <ProjectRow key={project.id} project={project} reason="Marked high priority" />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
