import { CircleX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageShell } from '../../shared/ui/page-shell';

export function PaymentCancelPage() {
  return (
    <PageShell
      eyebrow="CRM PAYMENTS"
      title="Payment cancelled"
      subtitle="You left the Stripe checkout before finishing."
    >
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-amber-700">
          <CircleX className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-gray-950">No charge was made</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600">
          The payment was not completed, so nothing was charged. The request stays pending — you can
          reopen the checkout link from your payments list whenever you are ready.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/payments"
            className="inline-flex h-10 items-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Back to payments
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex h-10 items-center rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
