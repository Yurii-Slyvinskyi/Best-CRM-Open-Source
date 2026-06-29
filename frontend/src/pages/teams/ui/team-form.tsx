import { FormEvent, useMemo, useState } from 'react';
import type { Team, TeamPayload } from '../../../entities/team';
import type { UserProfile } from '../../../entities/user';
import { getApiErrorMessage } from '../../../shared/api';
import { FormActions, FormError } from '../../../shared/ui/form';

type TeamFormValues = {
  name: string;
  workers: number[];
};

type TeamFormProps = {
  mode: 'create' | 'edit';
  team: Team | null;
  workers: UserProfile[];
  onSubmit: (payload: TeamPayload) => Promise<void>;
  onCancel: () => void;
};

export function TeamForm({
  mode,
  team,
  workers,
  onSubmit,
  onCancel,
}: TeamFormProps) {
  const [values, setValues] = useState<TeamFormValues>(() => ({
    name: team?.name ?? '',
    workers: team?.workers ?? [],
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Keep any already-assigned ids that are no longer worker accounts so an edit does not silently drop them.
  const workerOptions = useMemo(() => {
    const known = new Set(workers.map((worker) => worker.id));
    const options = workers.map((worker) => ({
      id: worker.id,
      label: `${worker.username} #${worker.id}`,
    }));

    (team?.workers ?? []).forEach((workerId) => {
      if (!known.has(workerId)) {
        options.push({ id: workerId, label: `Worker #${workerId}` });
      }
    });

    return options.sort((a, b) => a.id - b.id);
  }, [team, workers]);

  function toggleWorker(workerId: number) {
    setValues((current) => {
      const hasWorker = current.workers.includes(workerId);

      return {
        ...current,
        workers: hasWorker
          ? current.workers.filter((id) => id !== workerId)
          : [...current.workers, workerId],
      };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.name.trim()) {
      setError('Team name is required.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await onSubmit({ name: values.name.trim(), workers: values.workers });
    } catch (err) {
      setError(getApiErrorMessage(
        err,
        mode === 'create' ? 'Team could not be created.' : 'Team could not be updated.',
      ));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="border-b border-gray-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
          {mode === 'create' ? 'New team' : 'Edit team'}
        </p>
        <h2 className="mt-2 text-xl font-semibold text-gray-950">
          {mode === 'create' ? 'Create team' : values.name || 'Update team'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Company is assigned by the backend from the authenticated manager context.
        </p>
      </div>

      {error && <FormError message={error} />}

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Name</span>
        <input
          value={values.name}
          onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
          className="mt-2 h-11 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          required
        />
      </label>

      <fieldset>
        <legend className="text-sm font-medium text-gray-700">Workers</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {workerOptions.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
            >
              <input
                checked={values.workers.includes(option.id)}
                onChange={() => toggleWorker(option.id)}
                type="checkbox"
                className="h-4 w-4 accent-blue-700"
              />
              <span className="font-medium text-gray-950">{option.label}</span>
            </label>
          ))}
        </div>
        {!workerOptions.length && (
          <p className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            No workers are available in your current scope.
          </p>
        )}
      </fieldset>

      <FormActions
        onCancel={onCancel}
        submitLabel={mode === 'create' ? 'Create team' : 'Save changes'}
        submitPendingLabel="Saving..."
        isSubmitting={isSaving}
      />
    </form>
  );
}
