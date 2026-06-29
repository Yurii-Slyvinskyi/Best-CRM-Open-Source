import type { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  compact?: boolean;
};

export function EmptyState({ icon: Icon, title, description, compact = false }: EmptyStateProps) {
  if (compact) {
    return (
      <div className="flex items-start gap-3 rounded-md bg-gray-50 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-blue-700">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-blue-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-950">{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
}
