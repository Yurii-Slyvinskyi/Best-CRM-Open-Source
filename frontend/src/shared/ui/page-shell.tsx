import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

type PageShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
  width?: 'default' | 'wide';
};

export function PageShell({
  title,
  subtitle,
  children,
  eyebrow = 'CRM workspace',
  actions,
  width = 'default',
}: PageShellProps) {
  return (
    <section className={cn(
      'mx-auto flex w-full flex-col gap-5',
      width === 'wide' ? 'max-w-[100rem]' : 'max-w-7xl',
    )}>
      <div className="border-b border-gray-200 pb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">{eyebrow}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal text-gray-950">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">{subtitle}</p>
          </div>
          {actions && (
            <div className="flex shrink-0 items-center md:pt-6">
              {actions}
            </div>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
