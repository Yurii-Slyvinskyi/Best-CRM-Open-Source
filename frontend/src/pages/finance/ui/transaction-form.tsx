import { FormEvent, useState } from 'react';
import {
  type TransactionPayload,
  type TransactionType,
  type Transaction,
} from '../../../entities/finance';
import { getApiErrorMessage } from '../../../shared/api';
import { cn } from '../../../shared/lib/cn';
import { FormActions, FormError } from '../../../shared/ui/form';
import {
  formInputClasses,
  isPositiveAmount,
  transactionTypeFormOptions,
} from '../model/finance-helpers';
import { CurrencyField } from './currency-field';

type TransactionFormProps = {
  mode: 'create' | 'edit';
  transaction: Transaction | null;
  onSubmit: (payload: TransactionPayload) => Promise<void>;
  onCancel: () => void;
};

export function TransactionForm({ mode, transaction, onSubmit, onCancel }: TransactionFormProps) {
  const [values, setValues] = useState(() => ({
    amount: transaction?.amount ?? '',
    transaction_type: transaction?.transaction_type ?? 'income',
    currency: transaction?.currency ?? 'USD',
    description: transaction?.description ?? '',
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.amount.trim() || !isPositiveAmount(values.amount)) {
      setError('Amount must be a positive number.');
      return;
    }

    if (!values.description.trim()) {
      setError('Description is required.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await onSubmit({
        amount: values.amount.trim(),
        transaction_type: values.transaction_type,
        currency: values.currency,
        description: values.description.trim(),
      });
    } catch (err) {
      setError(getApiErrorMessage(
        err,
        mode === 'create' ? 'Transaction could not be created.' : 'Transaction could not be updated.',
      ));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="border-b border-gray-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
          {mode === 'create' ? 'New transaction' : 'Edit transaction'}
        </p>
        <h2 className="mt-2 text-xl font-semibold text-gray-950">
          {mode === 'create' ? 'Create transaction' : 'Update transaction'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Company is assigned by the backend from the authenticated manager context.
        </p>
      </div>

      {error && <FormError message={error} />}

      <div className="grid gap-4 md:grid-cols-2">
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

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Type</span>
          <select
            value={values.transaction_type}
            onChange={(event) => setValues((current) => ({
              ...current,
              transaction_type: event.target.value as TransactionType,
            }))}
            className={cn(formInputClasses, 'bg-white')}
          >
            {transactionTypeFormOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <CurrencyField
          value={values.currency}
          onChange={(currency) => setValues((current) => ({ ...current, currency }))}
        />

        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-gray-700">Description</span>
          <input
            value={values.description}
            onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
            className={formInputClasses}
            placeholder="Manual income"
            required
          />
        </label>
      </div>

      <FormActions
        onCancel={onCancel}
        submitLabel={mode === 'create' ? 'Create transaction' : 'Save changes'}
        submitPendingLabel="Saving..."
        isSubmitting={isSaving}
      />
    </form>
  );
}
