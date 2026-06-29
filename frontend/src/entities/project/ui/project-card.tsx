import { ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../../shared/lib/cn';
import type { Project } from '../model/types';
import { ProjectStatusBadge } from './project-status-badge';

type ProjectCardProps = {
  project: Project;
};

const priorityEyebrow = {
  high: { dot: 'bg-red-600', label: 'High' },
  medium: { dot: 'bg-orange-500', label: 'Medium' },
  low: { dot: 'bg-green-600', label: 'Low' },
  neutral: { dot: 'bg-gray-400', label: 'Unknown' },
};

function getPriorityEyebrow(priority: Project['priority'] | string | null) {
  if (priority === 'high' || priority === 'medium' || priority === 'low') {
    return priorityEyebrow[priority];
  }

  return priorityEyebrow.neutral;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const priority = getPriorityEyebrow(project.priority);

  return (
    <article className="flex h-full min-h-[228px] min-w-0 flex-col rounded-lg border border-gray-300 bg-white p-6 shadow-md transition hover:border-gray-400 hover:shadow-lg">
      <div className="flex items-center gap-2">
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', priority.dot)} aria-hidden="true" />
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.07em] text-gray-400">
          {priority.label} priority
        </span>
      </div>

      <h2 className="mt-3 line-clamp-2 break-words text-base font-semibold leading-snug text-gray-950">
        {project.name}
      </h2>

      <p className="mt-2 line-clamp-2 break-words text-sm leading-relaxed text-gray-500">
        {project.description}
      </p>

      <div className="mt-3 flex min-w-0 items-center gap-2 text-[0.8rem] text-gray-500">
        <MapPin className="h-4 w-4 shrink-0 text-gray-300" aria-hidden="true" />
        <span className="min-w-0 truncate">{project.address}</span>
      </div>

      <div className="mt-auto flex items-center justify-between pt-5">
        <ProjectStatusBadge status={project.status} />
        <Link
          to={`/projects/${project.id}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 transition-all hover:gap-2 hover:text-blue-800"
        >
          Open
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
