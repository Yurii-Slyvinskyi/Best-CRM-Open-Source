import { FormEvent, useState } from 'react';
import {
  type FinanceCurrency,
  type ManagerSalaryPayload,
  type Salary,
} from '../../../entities/finance';
import { type UserProfile } from '../../../entities/user';
import { cn } from '../../../shared/lib/cn';
import { getApiErrorMessage } from '../../../shared/api';
import { FormActions, FormError } from '../../../shared/ui/form';
import { formInputClasses, isPositiveAmount } from '../model/finance-helpers';
import { CurrencyField } from './currency-field';

type SalaryFormProps = {
  mode: 'create' | 'edit';
  salary: Salary | null;
  workers: UserProfile[];
  onSubmit: (payload: ManagerSalaryPayload) => Promise<void>;
  onCancel: () => void;
};

export function SalaryForm({ mode, salary, workers, onSubmit, onCancel }: SalaryFormProps) {
  const [values, setValues] = useState({
    worker: salary ? String(salary.worker) : '',
    amount: salary?.amount ?? '',
    currency: (salary?.currency ?? 'USD') as FinanceCurrency,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.worker) {
      setError('Worker is required.');
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
        worker: Number(values.worker),
        amount: values.amount.trim(),
        currency: values.currency,
      });
    } catch (err) {
      setError(getApiErrorMessage(
        err,
        mode === 'create' ? 'Salary could not be recorded.' : 'Salary could not be updated.',
      ));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="border-b border-gray-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
          {mode === 'create' ? 'New salary' : 'Edit salary'}
        </p>
        <h2 className="mt-2 text-xl font-semibold text-gray-950">
          {mode === 'create' ? 'Record salary payment' : 'Update salary payment'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          The backend keeps the matching expense transaction in sync automatically.
        </p>
      </div>

      {error && <FormError message={error} />}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-gray-700">Worker</span>
          <select
            value={values.worker}
            onChange={(event) => setValues((current) => ({ ...current, worker: event.target.value }))}
            className={cn(formInputClasses, 'bg-white')}
            required
          >
            <option value="">Select worker</option>
            {workers.map((worker) => (
              <option key={worker.id} value={worker.id}>{worker.username} #{worker.id}</option>
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
            placeholder="1000.00"
            required
          />
        </label>

        <CurrencyField
          value={values.currency}
          onChange={(currency) => setValues((current) => ({ ...current, currency }))}
        />
      </div>

      {!workers.length && (
        <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
          No workers are available in your current scope.
        </p>
      )}

      <FormActions
        onCancel={onCancel}
        submitLabel={mode === 'create' ? 'Record salary' : 'Save changes'}
        submitPendingLabel="Saving..."
        isSubmitting={isSaving}
      />
    </form>
  );
}
