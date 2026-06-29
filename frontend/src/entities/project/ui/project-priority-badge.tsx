import { cn } from '../../../shared/lib/cn';
import type { ProjectPriority } from '../model/types';

const priorityLabels: Record<ProjectPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const priorityClasses: Record<ProjectPriority, string> = {
  low: 'border-green-300 bg-green-50 text-green-800',
  medium: 'border-orange-300 bg-orange-50 text-orange-800',
  high: 'border-red-300 bg-red-50 text-red-800',
};

type ProjectPriorityBadgeProps = {
  priority?: ProjectPriority | string | null;
};

function isProjectPriority(priority: ProjectPriority | string | null | undefined): priority is ProjectPriority {
  return priority === 'low' || priority === 'medium' || priority === 'high';
}

export function ProjectPriorityBadge({ priority }: ProjectPriorityBadgeProps) {
  const isKnownPriority = isProjectPriority(priority);

  return (
    <span className={cn(
      'inline-flex whitespace-nowrap border px-2.5 py-1 text-xs font-semibold',
      isKnownPriority ? priorityClasses[priority] : 'border-gray-300 bg-gray-50 text-gray-700',
    )}>
      {isKnownPriority ? priorityLabels[priority] : 'Priority n/a'}
    </span>
  );
}
