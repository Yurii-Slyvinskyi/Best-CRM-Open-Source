import type { LucideIcon } from 'lucide-react';

type FactProps = {
  label: string;
  value: string;
  icon?: LucideIcon;
};

export function Fact({ label, value, icon: Icon }: FactProps) {
  return (
    <div className="bg-white p-4">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">{label}</p>
      <p className="flex items-center gap-1.5 text-[13.5px] text-gray-900">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-gray-300" aria-hidden="true" />}
        <span className="min-w-0 break-words">{value}</span>
      </p>
    </div>
  );
}
