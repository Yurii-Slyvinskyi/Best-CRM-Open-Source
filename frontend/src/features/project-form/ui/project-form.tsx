import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  type ProjectFormPayload,
  type ProjectPriority,
  type ProjectStatus,
} from '../../../entities/project';
import { getTeams, type Team } from '../../../entities/team';
import { getUsers, type UserProfile } from '../../../entities/user';
import { getApiErrorMessage } from '../../../shared/api';
import { FormActions, FormError } from '../../../shared/ui/form';
import { LoadingState } from '../../../shared/ui/loading-state';
import type { ProjectFormProps } from '../model/types';

type ProjectFormValues = {
  name: string;
  description: string;
  client: string;
  assigned_team: number[];
  address: string;
  start_date: string;
  end_date: string;
  priority: ProjectPriority;
  budget: string;
  status: ProjectStatus;
};

const priorityOptions: Array<{ value: ProjectPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const statusOptions: Array<{ value: ProjectStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'partially completed', label: 'Partially completed' },
  { value: 'completed', label: 'Completed' },
];

function getInitialValues({ mode, project }: ProjectFormProps): ProjectFormValues {
  return {
    name: project?.name ?? '',
    description: project?.description ?? '',
    client: project ? String(project.client) : '',
    assigned_team: project?.assigned_team ?? [],
    address: project?.address ?? '',
    start_date: project?.start_date ?? '',
    end_date: project?.end_date ?? '',
    priority: project?.priority ?? 'medium',
    budget: project?.budget ?? '',
    status: mode === 'edit' ? project?.status ?? 'pending' : 'pending',
  };
}


function buildPayload(values: ProjectFormValues, mode: ProjectFormProps['mode']): ProjectFormPayload {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    client: Number(values.client),
    assigned_team: values.assigned_team,
    address: values.address.trim(),
    start_date: values.start_date || null,
    end_date: values.end_date || null,
    priority: values.priority,
    budget: values.budget.trim() || null,
    ...(mode === 'edit' ? { status: values.status } : {}),
  };
}

export function ProjectForm({ mode, project, onSubmit, onCancel }: ProjectFormProps) {
  const [values, setValues] = useState(() => getInitialValues({ mode, project, onSubmit, onCancel }));
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isOptionsLoading, setIsOptionsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const clients = useMemo(() => users.filter((user) => user.role === 'client'), [users]);

  useEffect(() => {
    let isMounted = true;

    setIsOptionsLoading(true);
    setError('');

    Promise.all([getTeams(), getUsers()])
      .then(([teamsData, usersData]) => {
        if (isMounted) {
          setTeams(teamsData);
          setUsers(usersData);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(getApiErrorMessage(err, 'Form options could not be loaded.'));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsOptionsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function updateField(field: keyof ProjectFormValues, value: string | number[]) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleTeam(teamId: number) {
    setValues((current) => {
      const hasTeam = current.assigned_team.includes(teamId);

      return {
        ...current,
        assigned_team: hasTeam
          ? current.assigned_team.filter((id) => id !== teamId)
          : [...current.assigned_team, teamId],
      };
    });
  }

  function validateForm() {
    if (!values.name.trim()) {
      return 'Project name is required.';
    }

    if (!values.description.trim()) {
      return 'Description is required.';
    }

    if (!values.client) {
      return 'Client is required.';
    }

    if (!values.assigned_team.length) {
      return 'At least one team is required.';
    }

    if (!values.address.trim()) {
      return 'Address is required.';
    }

    if (!values.priority) {
      return 'Priority is required.';
    }

    if (values.start_date && values.end_date && values.end_date < values.start_date) {
      return 'End date cannot be earlier than start date.';
    }

    return '';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await onSubmit(buildPayload(values, mode));
    } catch (err) {
      setError(getApiErrorMessage(err, mode === 'create' ? 'Project could not be created.' : 'Project could not be updated.'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="border-b border-gray-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
          {mode === 'create' ? 'New project' : 'Edit project'}
        </p>
        <h2 className="mt-2 text-xl font-semibold text-gray-950">
          {mode === 'create' ? 'Create project' : values.name || 'Update project'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Company is assigned by the backend from the authenticated manager context.
        </p>
      </div>

      {error && <FormError message={error} />}

      {isOptionsLoading ? (
        <LoadingState title="Loading form options..." compact />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Name</span>
              <input
                value={values.name}
                onChange={(event) => updateField('name', event.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                required
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Description</span>
              <textarea
                value={values.description}
                onChange={(event) => updateField('description', event.target.value)}
                className="mt-2 min-h-28 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Client</span>
              <select
                value={values.client}
                onChange={(event) => updateField('client', event.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                required
              >
                <option value="">Select client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.username} #{client.id}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Priority</span>
              <select
                value={values.priority}
                onChange={(event) => updateField('priority', event.target.value as ProjectPriority)}
                className="mt-2 h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                required
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            {mode === 'edit' && (
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Status</span>
                <select
                  value={values.status}
                  onChange={(event) => updateField('status', event.target.value as ProjectStatus)}
                  className="mt-2 h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Budget</span>
              <input
                value={values.budget}
                onChange={(event) => updateField('budget', event.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                inputMode="decimal"
                placeholder="45000.00"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Address</span>
              <input
                value={values.address}
                onChange={(event) => updateField('address', event.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Start date</span>
              <input
                value={values.start_date}
                onChange={(event) => updateField('start_date', event.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                type="date"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">End date</span>
              <input
                value={values.end_date}
                onChange={(event) => updateField('end_date', event.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                type="date"
              />
            </label>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700">Assigned teams</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {teams.map((team) => (
                <label
                  key={team.id}
                  className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                >
                  <input
                    checked={values.assigned_team.includes(team.id)}
                    onChange={() => toggleTeam(team.id)}
                    type="checkbox"
                    className="h-4 w-4 accent-blue-700"
                  />
                  <span className="font-medium text-gray-950">{team.name}</span>
                  <span className="text-gray-500">#{team.id}</span>
                </label>
              ))}
            </div>
            {!teams.length && (
              <p className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                No teams are available in your current scope.
              </p>
            )}
          </fieldset>
        </>
      )}

      <FormActions
        onCancel={onCancel}
        submitLabel={mode === 'create' ? 'Create project' : 'Save changes'}
        submitPendingLabel="Saving..."
        isSubmitting={isSaving}
        isSubmitDisabled={isOptionsLoading}
      />
    </form>
  );
}
