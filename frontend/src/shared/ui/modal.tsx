import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

type ModalSize = '2xl' | '3xl';

type ModalProps = {
  children: ReactNode;
  size?: ModalSize;
  title?: string;
  // Optional: when provided, clicking the backdrop closes the modal. Existing modals
  // close via their own form/cancel buttons, so they intentionally do not pass this.
  onClose?: () => void;
};

const sizeClasses: Record<ModalSize, string> = {
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

export function Modal({ children, size = '2xl', title, onClose }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-gray-950/50 px-4 py-8"
      onClick={onClose}
    >
      <div
        className={cn(
          'mx-auto w-full rounded-lg border border-gray-200 bg-white p-6 shadow-lg',
          sizeClasses[size],
        )}
        onClick={onClose ? (event) => event.stopPropagation() : undefined}
      >
        {title && (
          <h2 className="mb-4 text-xl font-semibold text-gray-950">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
