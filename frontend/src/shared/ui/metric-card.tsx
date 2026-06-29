import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  detail?: string;
  variant?: 'default' | 'inline' | 'end';
  className?: string;
  valueClassName?: string;
  iconClassName?: string;
  iconContainerClassName?: string;
};

export function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  variant = 'default',
  className,
  valueClassName,
  iconClassName,
  iconContainerClassName,
}: MetricCardProps) {
  if (variant === 'inline') {
    return (
      <div className={cn('rounded-lg border border-gray-300 bg-white p-4 shadow-sm', className)}>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
          <Icon className={cn('h-4 w-4 text-blue-700', iconClassName)} aria-hidden="true" />
          {label}
        </div>
        <p className={cn('mt-2 break-words text-2xl font-semibold text-gray-950', valueClassName)}>
          {value}
        </p>
        {detail && <p className="mt-4 text-sm text-gray-600">{detail}</p>}
      </div>
    );
  }

  if (variant === 'end') {
    return (
      <div className={cn('rounded-lg border border-gray-200 bg-white p-4 shadow-sm', className)}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{label}</p>
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700',
              iconContainerClassName,
            )}
          >
            <Icon className={cn('h-4 w-4', iconClassName)} aria-hidden="true" />
          </span>
        </div>
        <p className={cn('mt-3 text-2xl font-semibold text-gray-950', valueClassName)}>{value}</p>
        {detail && <p className="mt-4 text-sm text-gray-600">{detail}</p>}
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden border border-gray-200 bg-white p-5 shadow-sm', className)}>
      <div className="absolute inset-y-0 left-0 w-1 bg-blue-600" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{label}</p>
          <p className={cn('mt-2 text-2xl font-semibold text-gray-950', valueClassName)}>{value}</p>
        </div>
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center border border-gray-200 bg-gray-50 text-blue-700',
            iconContainerClassName,
          )}
        >
          <Icon className={cn('h-5 w-5', iconClassName)} aria-hidden="true" />
        </div>
      </div>
      {detail && <p className="mt-4 text-sm text-gray-600">{detail}</p>}
    </div>
  );
}
