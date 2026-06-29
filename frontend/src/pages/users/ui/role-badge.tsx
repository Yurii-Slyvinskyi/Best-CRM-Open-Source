import type { UserRole } from '../../../entities/user';
import { roleBadgeClasses, roleLabels } from '../../../shared/config/roles';
import { cn } from '../../../shared/lib/cn';

type RoleBadgeProps = {
  role: UserRole;
};

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span className={cn(
      'inline-flex border px-2 py-1 text-xs font-semibold',
      roleBadgeClasses[role],
    )}>
      {roleLabels[role]}
    </span>
  );
}
