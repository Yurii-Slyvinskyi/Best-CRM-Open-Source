import type { ReactNode } from 'react';

type DataTableShellProps = {
  children: ReactNode;
};

type DataTableProps = {
  children: ReactNode;
};

type DataTableEmptyRowProps = {
  colSpan: number;
  message: string;
};

export function DataTableShell({ children }: DataTableShellProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-300 bg-white shadow-sm">
      {children}
    </div>
  );
}

export function DataTable({ children }: DataTableProps) {
  return (
    <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
      {children}
    </table>
  );
}

export function DataTableHeader({ children }: DataTableProps) {
  return (
    <thead className="bg-gray-500 text-xs font-semibold uppercase tracking-[0.12em] text-white">
      {children}
    </thead>
  );
}

export function DataTableBody({ children }: DataTableProps) {
  return (
    <tbody className="divide-y divide-gray-200 bg-white text-gray-700">
      {children}
    </tbody>
  );
}

export function DataTableEmptyRow({ colSpan, message }: DataTableEmptyRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-6 text-center text-sm text-gray-600">
        {message}
      </td>
    </tr>
  );
}
