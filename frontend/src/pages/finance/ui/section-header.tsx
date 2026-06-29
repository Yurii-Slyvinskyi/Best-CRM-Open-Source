import type { ReactNode } from 'react';

type SectionHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-gray-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-gray-600">{description}</p>
      </div>
      {action}
    </div>
  );
}
