import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type SectionPanelProps = {
  icon: LucideIcon;
  title: string;
  meta?: ReactNode;
  children: ReactNode;
};

export function SectionPanel({ icon: Icon, title, meta, children }: SectionPanelProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Icon className="h-[18px] w-[18px] shrink-0 text-gray-500" aria-hidden="true" />
          <h2 className="truncate text-[14.5px] font-semibold text-gray-950">{title}</h2>
        </div>
        {meta && <span className="shrink-0 text-xs text-gray-400">{meta}</span>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
