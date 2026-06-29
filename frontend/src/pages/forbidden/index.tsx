import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageShell } from '../../shared/ui/page-shell';

export function ForbiddenPage() {
  return (
    <PageShell
      title="Forbidden"
      subtitle="The selected preview role does not have access to this route."
    >
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-blue-700">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-gray-950">403 access preview</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600">
          Switch roles from the topbar or return to the dashboard.
        </p>
        <Link
          to="/dashboard"
          className="mt-5 inline-flex h-10 items-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          Back to dashboard
        </Link>
      </div>
    </PageShell>
  );
}
