type UserDetailItemProps = {
  label: string;
  value: string;
};

export function UserDetailItem({ label, value }: UserDetailItemProps) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-gray-800">
        {value}
      </dd>
    </div>
  );
}
