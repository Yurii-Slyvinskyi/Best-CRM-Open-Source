import { cn } from '../../../shared/lib/cn';
import type { ProjectStatus } from '../model/types';

const statusLabels: Record<ProjectStatus, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  cancelled: 'Cancelled',
  'partially completed': 'Partially completed',
  completed: 'Completed',
};

const statusClasses: Record<ProjectStatus, string> = {
  pending: 'border-gray-300 bg-gray-50 text-gray-800',
  assigned: 'border-blue-600 bg-blue-50 text-blue-800',
  cancelled: 'border-gray-400 bg-gray-100 text-gray-700',
  'partially completed': 'border-blue-500 bg-blue-50 text-blue-900',
  completed: 'border-gray-900 bg-gray-950 text-white',
};

type ProjectStatusBadgeProps = {
  status: ProjectStatus;
};

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex whitespace-nowrap border px-2.5 py-1 text-xs font-semibold',
      statusClasses[status],
    )}>
      {statusLabels[status]}
    </span>
  );
}
