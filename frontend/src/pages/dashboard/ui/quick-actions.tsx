import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export type DashboardQuickAction = {
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
};

type QuickActionsProps = {
  actions: DashboardQuickAction[];
};

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-gray-950">Quick actions</h2>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          Role-based links for common operational workflows.
        </p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={`${action.to}-${action.label}`}
            to={action.to}
            className="group flex items-start gap-3 rounded-md border border-gray-200 bg-gray-50 p-3 transition hover:border-blue-300 hover:bg-blue-50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-blue-700 transition group-hover:border-blue-300">
              <action.icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-gray-950">{action.label}</span>
              <span className="mt-1 block text-sm leading-6 text-gray-600">{action.description}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
