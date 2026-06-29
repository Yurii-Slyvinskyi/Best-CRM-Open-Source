import { FolderKanban } from 'lucide-react';
import { EmptyState } from '../../../shared/ui/empty-state';

type ProjectStatusSummaryProps = {
  total: number;
  active: number;
  completed: number;
  highPriority: number;
};

export function ProjectStatusSummary({
  total,
  active,
  completed,
  highPriority,
}: ProjectStatusSummaryProps) {
  if (total === 0) {
    return (
      <EmptyState
        compact
        icon={FolderKanban}
        title="No visible projects"
        description="Projects in your scope will appear here when they are available."
      />
    );
  }

  const rows = [
    { label: 'Active', value: active, bar: 'bg-blue-600' },
    { label: 'Completed', value: completed, bar: 'bg-green-600' },
    { label: 'Active high priority', value: highPriority, bar: 'bg-amber-500' },
  ];

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-950">Project status</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Current status mix across visible projects.
          </p>
        </div>
        <p className="rounded-md bg-gray-100 px-2.5 py-1 text-sm font-semibold text-gray-800">
          {total} total
        </p>
      </div>
      <dl className="mt-4 space-y-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-sm text-gray-600">{row.label}</dt>
              <dd className="text-sm font-semibold text-gray-950">{row.value}</dd>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-200" aria-hidden="true">
              <div
                className={`h-full rounded-full ${row.bar}`}
                style={{ width: `${total > 0 ? Math.round((row.value / total) * 100) : 0}%` }}
              />
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
