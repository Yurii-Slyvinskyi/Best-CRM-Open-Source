import { useCallback, useEffect, useMemo, useState } from 'react';
import { CreditCard, ExternalLink, Search } from 'lucide-react';
import { getProjects, type Project } from '../../entities/project';
import { getPayments, type Payment, type PaymentStatus } from '../../entities/finance';
import { getApiErrorMessage } from '../../shared/api';
import { cn } from '../../shared/lib/cn';
import { formatDateTime, formatMoney } from '../../shared/lib/format';
import {
  DataTable,
  DataTableBody,
  DataTableEmptyRow,
  DataTableHeader,
  DataTableShell,
} from '../../shared/ui/data-table';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { LoadingState } from '../../shared/ui/loading-state';
import { PageShell } from '../../shared/ui/page-shell';

const paymentStatusOptions: Array<{ value: '' | PaymentStatus; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'failed', label: 'Failed' },
];

const paymentStatusClasses: Record<PaymentStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  confirmed: 'border-green-200 bg-green-50 text-green-700',
  failed: 'border-red-200 bg-red-50 text-red-700',
};

export function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadPayments = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const [paymentsResult, projectsResult] = await Promise.allSettled([
        getPayments(),
        getProjects(),
      ]);

      if (paymentsResult.status === 'rejected') {
        throw paymentsResult.reason;
      }

      setPayments(paymentsResult.value);

      if (projectsResult.status === 'fulfilled') {
        setProjects(projectsResult.value);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Payments could not be loaded. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  function getProjectLabel(projectId: number) {
    const project = projects.find((currentProject) => currentProject.id === projectId);
    return project ? `${project.name} #${project.id}` : `Project #${projectId}`;
  }

  const filteredPayments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesSearch = !normalizedSearch
        || getProjectLabel(payment.project).toLowerCase().includes(normalizedSearch);
      const matchesStatus = !statusFilter || payment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payments, projects, search, statusFilter]);

  return (
    <PageShell
      eyebrow="CRM PAYMENTS"
      title="Payments"
      subtitle="Your payment status, checkout links, and completed payments."
      width="wide"
    >
      {isLoading && (
        <LoadingState
          title="Loading payments"
          description="Fetching your payment status and checkout history."
        />
      )}

      {!isLoading && error && (
        <ErrorState title="Unable to load payments" message={error} />
      )}

      {!isLoading && !error && payments.length === 0 && (
        <EmptyState
          icon={CreditCard}
          title="No payments found"
          description="You do not have any payments in your current scope yet."
        />
      )}

      {!isLoading && !error && payments.length > 0 && (
        <>
          <div className="rounded-lg border border-gray-300 bg-white p-3 shadow-md">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex h-10 min-w-[12.5rem] flex-1 items-center gap-2 rounded-md border border-gray-300 px-3 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
                <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search payments"
                  className="min-w-0 flex-1 text-sm text-gray-950 outline-none"
                  placeholder="Search project…"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by payment status"
                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                {paymentStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
              <p className="text-sm text-gray-600">
                Showing <strong className="font-semibold text-gray-950">{filteredPayments.length}</strong> of{' '}
                <strong className="font-semibold text-gray-950">{payments.length}</strong> payments
              </p>
            </div>
          </div>

          <DataTableShell>
            <DataTable>
              <DataTableHeader>
                <tr>
                  <th className="min-w-[14rem] px-4 py-4">Project</th>
                  <th className="min-w-[10rem] px-4 py-4">Amount</th>
                  <th className="min-w-[8rem] px-4 py-4">Status</th>
                  <th className="min-w-[12rem] px-4 py-4">Created at</th>
                  <th className="min-w-[10rem] px-4 py-4">Action</th>
                </tr>
              </DataTableHeader>
              <DataTableBody>
                {filteredPayments.length === 0 && (
                  <DataTableEmptyRow colSpan={5} message="No payments match the current filters." />
                )}
                {filteredPayments.map((payment) => {
                  const canPay = payment.status === 'pending' && Boolean(payment.session_url);

                  return (
                    <tr key={payment.id}>
                      <td className="min-w-[14rem] break-words px-4 py-4 text-gray-950">
                        {getProjectLabel(payment.project)}
                      </td>
                      <td className="min-w-[10rem] px-4 py-4 font-semibold text-gray-950">
                        {formatMoney(payment.amount, payment.currency)}
                      </td>
                      <td className="min-w-[8rem] px-4 py-4">
                        <span className={cn(
                          'inline-flex rounded-md border px-2 py-1 text-xs font-semibold capitalize',
                          paymentStatusClasses[payment.status],
                        )}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="min-w-[12rem] px-4 py-4">{formatDateTime(payment.created_at)}</td>
                      <td className="min-w-[10rem] px-4 py-4">
                        {canPay ? (
                          <a
                            href={payment.session_url ?? undefined}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                          >
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            Pay now
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">
                            {payment.status === 'pending' ? 'Awaiting checkout link' : 'No action needed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </DataTableBody>
            </DataTable>
          </DataTableShell>
        </>
      )}
    </PageShell>
  );
}
