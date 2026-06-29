import type { ReactNode } from 'react';
import { Save, X } from 'lucide-react';

type FormErrorProps = {
  message: string;
};

type FieldErrorProps = {
  message?: string;
};

type FormActionsProps = {
  onCancel?: () => void;
  submitLabel: string;
  submitPendingLabel?: string;
  isSubmitting?: boolean;
  isSubmitDisabled?: boolean;
  cancelLabel?: string;
  submitIcon?: ReactNode;
  cancelIcon?: ReactNode;
};

export function FormError({ message }: FormErrorProps) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-700">
      {message}
    </div>
  );
}

export function FieldError({ message }: FieldErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 text-sm leading-6 text-red-700">
      {message}
    </p>
  );
}

export function FormActions({
  onCancel,
  submitLabel,
  submitPendingLabel = submitLabel,
  isSubmitting = false,
  isSubmitDisabled = false,
  cancelLabel = 'Cancel',
  submitIcon = <Save className="h-4 w-4" aria-hidden="true" />,
  cancelIcon = <X className="h-4 w-4" aria-hidden="true" />,
}: FormActionsProps) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 w-full min-w-0 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950 sm:w-auto"
        >
          {cancelIcon}
          <span className="truncate">{cancelLabel}</span>
        </button>
      )}
      <button
        type="submit"
        disabled={isSubmitDisabled || isSubmitting}
        className="inline-flex h-10 w-full min-w-0 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-gray-400 sm:w-auto"
      >
        {submitIcon}
        <span className="truncate">{isSubmitting ? submitPendingLabel : submitLabel}</span>
      </button>
    </div>
  );
}
