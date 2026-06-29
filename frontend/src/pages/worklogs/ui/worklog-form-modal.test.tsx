import { FormEvent, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Project } from '../../../entities/project';
import type { Team } from '../../../entities/team';
import type { UserProfile } from '../../../entities/user';
import {
  buildWorklogPayload,
  validateWorklogForm,
  type WorklogFormErrors,
  type WorklogFormValues,
} from '../model/worklog-form';
import { WorklogFormModal } from './worklog-form-modal';

const workerOptions: UserProfile[] = [
  {
    id: 4,
    username: 'worker_one',
    email: 'worker@example.com',
    role: 'worker',
    phone: null,
    address: null,
    company: 'Acme',
  },
];

const projectOptions: Project[] = [
  {
    id: 10,
    name: 'Lakeview Renovation',
    description: 'Kitchen work',
    status: 'assigned',
    assigned_team: [7],
    client: 100,
    company: 1,
    address: '123 Lake Street',
    start_date: null,
    end_date: null,
    priority: 'medium',
    budget: null,
    created_at: '2026-06-18T10:00:00Z',
    updated_at: '2026-06-18T10:00:00Z',
    blueprint: null,
    chat_room: null,
  },
];

const teamOptions: Team[] = [
  { id: 7, name: 'Alpha crew', company: 1, workers: [4] },
];

function makeValues(overrides: Partial<WorklogFormValues> = {}): WorklogFormValues {
  return {
    worker: '',
    project: '',
    team: '',
    date: '',
    hours_worked: '',
    description: '',
    ...overrides,
  };
}

type HarnessProps = {
  isManager?: boolean;
  initialValues?: WorklogFormValues;
  initialErrors?: WorklogFormErrors;
  onPayload?: ReturnType<typeof vi.fn>;
};

function WorklogFormHarness({
  isManager = true,
  initialValues = makeValues(),
  initialErrors = {},
  onPayload = vi.fn(),
}: HarnessProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<WorklogFormErrors>(initialErrors);

  function handleFieldChange(field: keyof WorklogFormValues, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors((current) => ({
      ...current,
      [field]: '',
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateWorklogForm(values, isManager);

    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      return;
    }

    onPayload(buildWorklogPayload(values, isManager));
  }

  return (
    <WorklogFormModal
      eyebrow="New worklog"
      title="Create worklog"
      description="Record hours against a project."
      values={values}
      errors={errors}
      formError=""
      isManager={isManager}
      isSubmitting={false}
      submitLabel="Create worklog"
      submitPendingLabel="Creating..."
      workerOptions={workerOptions}
      projectOptions={projectOptions}
      teamOptions={teamOptions}
      onFieldChange={handleFieldChange}
      onSubmit={handleSubmit}
      onCancel={vi.fn()}
    />
  );
}

function submitWorklogForm() {
  fireEvent.submit(screen.getByRole('button', { name: 'Create worklog' }).closest('form') as HTMLFormElement);
}

describe('WorklogFormModal', () => {
  it('renders required fields', () => {
    render(<WorklogFormHarness />);

    expect(screen.getByLabelText('Worker')).toBeInTheDocument();
    expect(screen.getByLabelText('Project')).toBeInTheDocument();
    expect(screen.getByLabelText('Team')).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Hours')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('validates required fields with current messages', async () => {
    render(<WorklogFormHarness />);

    submitWorklogForm();

    expect(await screen.findByText('Worker is required.')).toBeInTheDocument();
    expect(screen.getByText('Project is required.')).toBeInTheDocument();
    expect(screen.getByText('Team is required.')).toBeInTheDocument();
    expect(screen.getByText('Date is required.')).toBeInTheDocument();
    expect(screen.getByText('Hours are required.')).toBeInTheDocument();
  });

  it('validates hours according to current behavior', async () => {
    const user = userEvent.setup();

    render(<WorklogFormHarness initialValues={makeValues({
      worker: '4',
      project: '10',
      team: '7',
      date: '2026-06-18',
      hours_worked: '1.5',
    })} />);

    submitWorklogForm();

    expect(await screen.findByText('Hours must be a positive integer.')).toBeInTheDocument();

    const hoursInput = screen.getByDisplayValue('1.5');

    await user.clear(hoursInput);
    await user.type(hoursInput, '2');
    submitWorklogForm();

    await waitFor(() => {
      expect(screen.queryByText('Hours must be a positive integer.')).not.toBeInTheDocument();
    });
  });

  it('shows manager worker selection and submits expected payload', async () => {
    const user = userEvent.setup();
    const onPayload = vi.fn();

    render(<WorklogFormHarness onPayload={onPayload} />);

    await user.selectOptions(screen.getByLabelText('Worker'), '4');
    await user.selectOptions(screen.getByLabelText('Project'), '10');
    await user.selectOptions(screen.getByLabelText('Team'), '7');
    await user.type(screen.getByLabelText('Date'), '2026-06-18');
    await user.type(screen.getByLabelText('Hours'), '8');
    await user.type(screen.getByLabelText('Description'), '  Installed framing  ');
    await user.click(screen.getByRole('button', { name: 'Create worklog' }));

    expect(onPayload).toHaveBeenCalledWith({
      worker: 4,
      project: 10,
      team: 7,
      date: '2026-06-18',
      hours_worked: 8,
      description: 'Installed framing',
    });
  });

  it('omits worker selection for non-manager users', () => {
    render(<WorklogFormHarness isManager={false} />);

    expect(screen.queryByLabelText('Worker')).not.toBeInTheDocument();
  });
});
