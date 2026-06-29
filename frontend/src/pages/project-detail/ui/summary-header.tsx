import { formatProjectDate, ProjectStatusBadge, type Project } from '../../../entities/project';
import type { UserProfile } from '../../../entities/user';
import { cn } from '../../../shared/lib/cn';
import { getPriorityDot } from '../lib/project-detail-helpers';
import { ProjectActions } from './project-actions';

type SummaryHeaderProps = {
  project: Project;
  user: UserProfile | null;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export function SummaryHeader({ project, user, isDeleting, onEdit, onDelete }: SummaryHeaderProps) {
  const priority = getPriorityDot(project.priority);

  return (
    <section className="rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', priority.dot)} aria-hidden="true" />
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.07em] text-gray-400">
              {priority.label} priority
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3.5">
            <h2 className="break-words text-2xl font-bold tracking-tight text-gray-950">{project.name}</h2>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className="mt-2.5 text-[13px] text-gray-400">
            Updated {formatProjectDate(project.updated_at)} · Project #{project.id}
          </p>
        </div>

        {user && (
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <ProjectActions
              role={user.role}
              status={project.status}
              isDeleting={isDeleting}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        )}
      </div>
    </section>
  );
}
