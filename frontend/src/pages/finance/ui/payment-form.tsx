import { FormEvent, useState } from 'react';
import { type Project } from '../../../entities/project';
import {
  type FinanceCurrency,
  type ManagerPaymentPayload,
  type Payment,
} from '../../../entities/finance';
import { type UserProfile } from '../../../entities/user';
import { cn } from '../../../shared/lib/cn';
import { getApiErrorMessage } from '../../../shared/api';
import { FormActions, FormError } from '../../../shared/ui/form';
import { formInputClasses, isPositiveAmount } from '../model/finance-helpers';
import { CurrencyField } from './currency-field';

type PaymentFormProps = {
  mode: 'create' | 'edit';
  payment: Payment | null;
  clients: UserProfile[];
  projects: Project[];
  onSubmit: (payload: ManagerPaymentPayload) => Promise<void>;
  onCancel: () => void;
};

export function PaymentForm({ mode, payment, clients, projects, onSubmit, onCancel }: PaymentFormProps) {
  const [values, setValues] = useState({
    client: payment ? String(payment.client) : '',
    project: payment ? String(payment.project) : '',
    amount: payment?.amount ?? '',
    currency: (payment?.currency ?? 'USD') as FinanceCurrency,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.client) {
      setError('Client is required.');
      return;
    }

    if (!values.project) {
      setError('Project is required.');
      return;
    }

    if (!values.amount.trim() || !isPositiveAmount(values.amount)) {
      setError('Amount must be a positive number.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await onSubmit({
        client: Number(values.client),
        project: Number(values.project),
        amount: values.amount.trim(),
        currency: values.currency,
      });
    } catch (err) {
      setError(getApiErrorMessage(
        err,
        mode === 'create' ? 'Payment request could not be created.' : 'Payment request could not be updated.',
      ));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="border-b border-gray-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
          {mode === 'create' ? 'New payment' : 'Edit payment'}
        </p>
        <h2 className="mt-2 text-xl font-semibold text-gray-950">
          {mode === 'create' ? 'Create payment request' : 'Update payment request'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          {mode === 'create'
            ? 'The backend creates a Stripe Checkout session. A checkout link appears in the payments table once available.'
            : 'Editing re-issues the Stripe Checkout session, so a new checkout link is generated. Only pending payments can be edited.'}
        </p>
      </div>

      {error && <FormError message={error} />}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Client</span>
          <select
            value={values.client}
            onChange={(event) => setValues((current) => ({ ...current, client: event.target.value }))}
            className={cn(formInputClasses, 'bg-white')}
            required
          >
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.username} #{client.id}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Project</span>
          <select
            value={values.project}
            onChange={(event) => setValues((current) => ({ ...current, project: event.target.value }))}
            className={cn(formInputClasses, 'bg-white')}
            required
          >
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name} #{project.id}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Amount</span>
          <input
            value={values.amount}
            onChange={(event) => setValues((current) => ({ ...current, amount: event.target.value }))}
            className={formInputClasses}
            inputMode="decimal"
            placeholder="500.00"
            required
          />
        </label>

        <CurrencyField
          value={values.currency}
          onChange={(currency) => setValues((current) => ({ ...current, currency }))}
        />
      </div>

      {!clients.length && (
        <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
          No clients are available in your current scope.
        </p>
      )}

      <FormActions
        onCancel={onCancel}
        submitLabel={mode === 'create' ? 'Create payment' : 'Save changes'}
        submitPendingLabel="Saving..."
        isSubmitting={isSaving}
      />
    </form>
  );
}
