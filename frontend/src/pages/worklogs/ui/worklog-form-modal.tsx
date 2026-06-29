import type { FormEvent } from 'react';
import type { Project } from '../../../entities/project';
import type { Team } from '../../../entities/team';
import type { UserProfile } from '../../../entities/user';
import { FieldError, FormActions, FormError } from '../../../shared/ui/form';
import { Modal } from '../../../shared/ui/modal';
import type { WorklogFormErrors, WorklogFormValues } from '../model/worklog-form';

type WorklogFormModalProps = {
  eyebrow: string;
  title: string;
  description: string;
  values: WorklogFormValues;
  errors: WorklogFormErrors;
  formError: string;
  isManager: boolean;
  isSubmitting: boolean;
  submitLabel: string;
  submitPendingLabel: string;
  workerOptions: UserProfile[];
  projectOptions: Project[];
  teamOptions: Team[];
  onFieldChange: (field: keyof WorklogFormValues, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export function WorklogFormModal({
  eyebrow,
  title,
  description,
  values,
  errors,
  formError,
  isManager,
  isSubmitting,
  submitLabel,
  submitPendingLabel,
  workerOptions,
  projectOptions,
  teamOptions,
  onFieldChange,
  onSubmit,
  onCancel,
}: WorklogFormModalProps) {
  return (
    <Modal size="3xl">
      <form className="space-y-5" onSubmit={onSubmit}>
          <div className="border-b border-gray-200 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">{eyebrow}</p>
            <h2 className="mt-2 text-xl font-semibold text-gray-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {description}
            </p>
          </div>

          {formError && <FormError message={formError} />}

          <div className="grid gap-4 md:grid-cols-2">
            {isManager && (
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Worker</span>
                <select
                  value={values.worker}
                  onChange={(event) => onFieldChange('worker', event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  required
                >
                  <option value="">Select worker</option>
                  {workerOptions.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.username}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.worker} />
              </label>
            )}

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Project</span>
              <select
                value={values.project}
                onChange={(event) => onFieldChange('project', event.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                required
              >
                <option value="">Select project</option>
                {projectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <FieldError message={errors.project} />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Team</span>
              <select
                value={values.team}
                onChange={(event) => onFieldChange('team', event.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                required
              >
                <option value="">Select team</option>
                {teamOptions.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <FieldError message={errors.team} />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Date</span>
              <input
                value={values.date}
                onChange={(event) => onFieldChange('date', event.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                type="date"
                required
              />
              <FieldError message={errors.date} />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Hours</span>
              <input
                value={values.hours_worked}
                onChange={(event) => onFieldChange('hours_worked', event.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                min="1"
                step="1"
                type="number"
                required
              />
              <FieldError message={errors.hours_worked} />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Description</span>
              <textarea
                value={values.description}
                onChange={(event) => onFieldChange('description', event.target.value)}
                className="mt-2 min-h-28 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          <FormActions
            onCancel={onCancel}
            submitLabel={submitLabel}
            submitPendingLabel={submitPendingLabel}
            isSubmitting={isSubmitting}
          />
        </form>
    </Modal>
  );
}
