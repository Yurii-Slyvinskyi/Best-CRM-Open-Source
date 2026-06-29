import type { ReactNode } from 'react';

type ErrorStateProps = {
  title: string;
  message: string;
  action?: ReactNode;
};

export function ErrorState({ title, message, action }: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-red-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-red-700">{message}</p>
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}
