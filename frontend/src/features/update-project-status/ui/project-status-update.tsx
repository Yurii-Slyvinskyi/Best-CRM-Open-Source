import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, Save } from 'lucide-react';
import {
  updateProjectStatus,
  type Project,
  type ProjectStatus,
} from '../../../entities/project';
import { ApiError } from '../../../shared/api';

type ProjectStatusUpdateProps = {
  projectId: string | number;
  currentStatus: ProjectStatus;
  onUpdated: (project: Project) => void;
};

const statusOptions: Array<{ value: ProjectStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'partially completed', label: 'Partially completed' },
  { value: 'completed', label: 'Completed' },
];

function getStatusUpdateError(err: unknown) {
  if (err instanceof ApiError) {
    if (err.details && typeof err.details === 'object') {
      const entries = Object.entries(err.details);
      const firstError = entries.find(([, value]) => value);

      if (firstError) {
        const [field, value] = firstError;

        if (Array.isArray(value)) {
          return `${field}: ${value.join(' ')}`;
        }

        if (typeof value === 'string') {
          return `${field}: ${value}`;
        }
      }
    }

    if (err.status === 403) {
      return `Permission denied: ${err.message}`;
    }

    return err.message;
  }

  return 'Project status could not be updated. Please try again.';
}

export function ProjectStatusUpdate({ projectId, currentStatus, onUpdated }: ProjectStatusUpdateProps) {
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus>(currentStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setSelectedStatus(currentStatus);
  }, [currentStatus]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const updatedProject = await updateProjectStatus(projectId, selectedStatus);
      onUpdated(updatedProject);
      setSuccess('Project status updated.');
    } catch (err) {
      setError(getStatusUpdateError(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-lg border border-blue-200 bg-white shadow-sm">
      <div className="border-b border-blue-100 bg-blue-50/70 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">Worker action</p>
        <h2 className="mt-1 text-base font-semibold text-gray-950">Update status</h2>
      </div>

      <form className="space-y-3 p-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Status</span>
          <select
            value={selectedStatus}
            onChange={(event) => {
              setSelectedStatus(event.target.value as ProjectStatus);
              setError('');
              setSuccess('');
            }}
            className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-900">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving || selectedStatus === currentStatus}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {isSaving ? 'Saving...' : selectedStatus === currentStatus ? 'Status is current' : 'Save status'}
        </button>
      </form>
    </section>
  );
}
