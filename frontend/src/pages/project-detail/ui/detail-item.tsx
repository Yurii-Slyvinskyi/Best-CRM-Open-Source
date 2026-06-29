type DetailItemProps = {
  label: string;
  value: string;
};

export function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="flex flex-col gap-1 border-b border-gray-100 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">{label}</p>
      <p className="break-words text-[13.5px] font-medium text-gray-900 sm:text-right">{value}</p>
    </div>
  );
}
