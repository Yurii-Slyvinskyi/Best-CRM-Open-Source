import { Eye, Pencil, Trash2 } from 'lucide-react';
import type { Project } from '../../../entities/project';
import type { UserRole } from '../../../entities/user';

type ProjectActionsProps = {
  role: UserRole;
  status: Project['status'];
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export function ProjectActions({ role, status, isDeleting, onEdit, onDelete }: ProjectActionsProps) {
  const isCompleted = status === 'completed';

  if (role === 'manager') {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-[38px] items-center gap-2 rounded-md bg-blue-700 px-4 text-[13.5px] font-semibold text-white transition hover:bg-blue-800"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit project
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting || isCompleted}
          className="inline-flex h-[38px] items-center gap-2 rounded-md border border-red-200 bg-white px-3.5 text-[13.5px] font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {isDeleting ? 'Deleting…' : 'Delete'}
        </button>
        {isCompleted && (
          <p className="basis-full text-right text-xs leading-5 text-gray-400">
            Completed projects cannot be deleted.
          </p>
        )}
      </div>
    );
  }

  if (role === 'worker') {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[12.5px] font-medium text-gray-500">
      <Eye className="h-4 w-4 text-gray-400" aria-hidden="true" />
      Read-only view
    </span>
  );
}
