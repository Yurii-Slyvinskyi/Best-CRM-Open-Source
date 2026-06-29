import { FormEvent, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { UserProfile } from '../../../entities/user';
import { getApiErrorMessage } from '../../../shared/api';
import { FormActions, FormError } from '../../../shared/ui/form';
import {
  getCreateUserFormValues,
  getEditUserFormValues,
  managerRoleOptions,
  validateUserForm,
  type EditableUserRole,
  type UserFormMode,
  type UserFormValues,
} from '../model/users-helpers';

type UserFormProps = {
  mode: UserFormMode;
  user?: UserProfile | null;
  onSubmit: (values: UserFormValues) => Promise<void>;
  onCancel: () => void;
  // Edit-only destructive action. When omitted, no delete UI is rendered.
  onDelete?: () => Promise<void>;
  canDelete?: boolean;
  deleteDisabledReason?: string;
};

const inputClasses = 'mt-2 h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100';

export function UserForm({
  mode,
  user,
  onSubmit,
  onCancel,
  onDelete,
  canDelete = false,
  deleteDisabledReason,
}: UserFormProps) {
  const isEdit = mode === 'edit';
  const [values, setValues] = useState<UserFormValues>(() => (
    isEdit && user ? getEditUserFormValues(user) : getCreateUserFormValues()
  ));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isBusy = isSubmitting || isDeleting;

  function updateField(field: keyof UserFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateUserForm(values, mode);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(values);
    } catch (err) {
      setError(getApiErrorMessage(
        err,
        isEdit ? 'User could not be updated.' : 'User could not be created.',
      ));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!onDelete) {
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await onDelete();
    } catch (err) {
      setError(getApiErrorMessage(err, 'User could not be deleted.'));
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="border-b border-gray-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
          {isEdit ? 'Edit user' : 'Register user'}
        </p>
        <h2 className="mt-2 text-lg font-semibold text-gray-950">
          {isEdit ? `Edit ${user?.username ?? 'company user'}` : 'Create company user'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          {isEdit
            ? 'Update the worker or client account. Company is kept from your manager context.'
            : 'Managers can create worker or client accounts for their company.'}
        </p>
      </div>

      {error && <FormError message={error} />}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Username</span>
          <input
            value={values.username}
            onChange={(event) => updateField('username', event.target.value)}
            className={inputClasses}
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Email</span>
          <input
            value={values.email}
            onChange={(event) => updateField('email', event.target.value)}
            className={inputClasses}
            type="email"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">
            {isEdit ? 'New password' : 'Password'}
          </span>
          <input
            value={values.password}
            onChange={(event) => updateField('password', event.target.value)}
            className={inputClasses}
            type="password"
            placeholder={isEdit ? 'Leave blank to keep current' : undefined}
            autoComplete="new-password"
            required={!isEdit}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Role</span>
          <select
            value={values.role}
            onChange={(event) => updateField('role', event.target.value as EditableUserRole)}
            className={`${inputClasses} bg-white`}
          >
            {managerRoleOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Phone</span>
          <input
            value={values.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            className={inputClasses}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Address</span>
          <input
            value={values.address}
            onChange={(event) => updateField('address', event.target.value)}
            className={inputClasses}
          />
        </label>
      </div>

      <FormActions
        onCancel={onCancel}
        submitLabel={isEdit ? 'Save changes' : 'Create user'}
        submitPendingLabel={isEdit ? 'Saving...' : 'Creating...'}
        isSubmitting={isSubmitting}
        isSubmitDisabled={isBusy}
      />

      {isEdit && onDelete && (
        <div className="border-t border-gray-200 pt-4">
          {!isConfirmingDelete ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                disabled={!canDelete || isBusy}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete user
              </button>
              {!canDelete && deleteDisabledReason && (
                <p className="text-sm leading-6 text-gray-500">{deleteDisabledReason}</p>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-900">
                Delete {user?.username ?? 'this user'}? This action cannot be undone.
              </p>
              <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  disabled={isDeleting}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  {isDeleting ? 'Deleting...' : 'Delete user'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
