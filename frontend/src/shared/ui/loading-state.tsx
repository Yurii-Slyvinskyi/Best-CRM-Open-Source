type LoadingStateProps = {
  title?: string;
  description?: string;
  compact?: boolean;
};

export function LoadingState({
  title = 'Loading',
  description,
  compact = false,
}: LoadingStateProps) {
  if (compact) {
    return (
      <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
        {description ?? title}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-950">{title}</p>
      {description && (
        <p className="mt-1 text-sm leading-6 text-gray-600">{description}</p>
      )}
    </div>
  );
}
