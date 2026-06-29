import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Project } from '../../../entities/project';
import type { Team } from '../../../entities/team';
import type { UserProfile } from '../../../entities/user';
import { ProjectForm } from './project-form';

const teamMocks = vi.hoisted(() => ({
  getTeams: vi.fn(),
}));

const userMocks = vi.hoisted(() => ({
  getUsers: vi.fn(),
}));

vi.mock('../../../entities/team', () => teamMocks);
vi.mock('../../../entities/user', () => userMocks);

const teams: Team[] = [
  { id: 10, name: 'Alpha crew', company: 1, workers: [1, 2] },
  { id: 20, name: 'Beta crew', company: 1, workers: [3] },
];

const users: UserProfile[] = [
  {
    id: 100,
    username: 'client_one',
    email: 'client@example.com',
    role: 'client',
    phone: null,
    address: null,
    company: 'Acme',
  },
  {
    id: 200,
    username: 'worker_one',
    email: 'worker@example.com',
    role: 'worker',
    phone: null,
    address: null,
    company: 'Acme',
  },
];

const existingProject: Project = {
  id: 1,
  name: 'Existing project',
  description: 'Existing description',
  status: 'assigned',
  assigned_team: [10],
  client: 100,
  company: 1,
  address: '123 Lake Street',
  start_date: '2026-06-18',
  end_date: '2026-07-01',
  priority: 'high',
  budget: '45000.00',
  created_at: '2026-06-18T10:00:00Z',
  updated_at: '2026-06-18T10:00:00Z',
  blueprint: null,
  chat_room: null,
};

async function renderProjectForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  teamMocks.getTeams.mockResolvedValue(teams);
  userMocks.getUsers.mockResolvedValue(users);

  render(
    <ProjectForm
      mode="create"
      onSubmit={onSubmit}
      onCancel={vi.fn()}
    />,
  );

  await screen.findByLabelText('Name');

  return { onSubmit };
}

async function renderProjectEditForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  teamMocks.getTeams.mockResolvedValue(teams);
  userMocks.getUsers.mockResolvedValue(users);

  render(
    <ProjectForm
      mode="edit"
      project={existingProject}
      onSubmit={onSubmit}
      onCancel={vi.fn()}
    />,
  );

  await screen.findByLabelText('Name');

  return { onSubmit };
}

async function fillValidProjectForm() {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText('Name'), '  Lakeview renovation  ');
  await user.type(screen.getByLabelText('Description'), '  Kitchen and deck work  ');
  await user.selectOptions(screen.getByLabelText('Client'), '100');
  await user.type(screen.getByLabelText('Budget'), '  45000.00  ');
  await user.type(screen.getByLabelText('Address'), '  123 Lake Street  ');
  await user.type(screen.getByLabelText('Start date'), '2026-06-18');
  await user.type(screen.getByLabelText('End date'), '2026-07-01');
  await user.click(screen.getByLabelText(/Alpha crew/));
}

function submitProjectForm() {
  fireEvent.submit(screen.getByRole('button', { name: 'Create project' }).closest('form') as HTMLFormElement);
}

describe('ProjectForm', () => {
  beforeEach(() => {
    teamMocks.getTeams.mockReset();
    userMocks.getUsers.mockReset();
  });

  it('renders required project fields and team options', async () => {
    await renderProjectForm();

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Client')).toBeInTheDocument();
    expect(screen.getByLabelText('Priority')).toBeInTheDocument();
    expect(screen.getByLabelText('Address')).toBeInTheDocument();
    expect(screen.getByText('Assigned teams')).toBeInTheDocument();
    expect(screen.getByLabelText(/Alpha crew/)).toBeInTheDocument();
  });

  it('validates required fields with current messages', async () => {
    const user = userEvent.setup();

    await renderProjectForm();

    submitProjectForm();
    expect(screen.getByText('Project name is required.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Name'), 'Lakeview');
    submitProjectForm();
    expect(screen.getByText('Description is required.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Description'), 'Kitchen work');
    submitProjectForm();
    expect(screen.getByText('Client is required.')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Client'), '100');
    submitProjectForm();
    expect(screen.getByText('At least one team is required.')).toBeInTheDocument();

    await user.click(screen.getByLabelText(/Alpha crew/));
    submitProjectForm();
    expect(screen.getByText('Address is required.')).toBeInTheDocument();
  });

  it('validates end date against start date according to current behavior', async () => {
    const user = userEvent.setup();

    await renderProjectForm();
    await user.type(screen.getByLabelText('Name'), 'Lakeview');
    await user.type(screen.getByLabelText('Description'), 'Kitchen work');
    await user.selectOptions(screen.getByLabelText('Client'), '100');
    await user.click(screen.getByLabelText(/Alpha crew/));
    await user.type(screen.getByLabelText('Address'), '123 Lake Street');
    await user.type(screen.getByLabelText('Start date'), '2026-06-18');
    await user.type(screen.getByLabelText('End date'), '2026-06-17');

    submitProjectForm();

    expect(screen.getByText('End date cannot be earlier than start date.')).toBeInTheDocument();
  });

  it('toggles teams and submits a trimmed normalized payload', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    await renderProjectForm(onSubmit);
    await fillValidProjectForm();
    await user.click(screen.getByLabelText(/Beta crew/));
    await user.click(screen.getByLabelText(/Beta crew/));
    await user.click(screen.getByRole('button', { name: 'Create project' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Lakeview renovation',
        description: 'Kitchen and deck work',
        client: 100,
        assigned_team: [10],
        address: '123 Lake Street',
        start_date: '2026-06-18',
        end_date: '2026-07-01',
        priority: 'medium',
        budget: '45000.00',
      });
    });
  });

  it('renders existing values and submits edit payload with status', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    await renderProjectEditForm(onSubmit);

    expect(screen.getByLabelText('Name')).toHaveValue('Existing project');
    expect(screen.getByLabelText('Description')).toHaveValue('Existing description');
    expect(screen.getByLabelText('Client')).toHaveValue('100');
    expect(screen.getByLabelText('Priority')).toHaveValue('high');
    expect(screen.getByLabelText('Status')).toHaveValue('assigned');
    expect(screen.getByLabelText(/Alpha crew/)).toBeChecked();

    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), '  Updated project  ');
    await user.selectOptions(screen.getByLabelText('Status'), 'completed');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Updated project',
        description: 'Existing description',
        client: 100,
        assigned_team: [10],
        address: '123 Lake Street',
        start_date: '2026-06-18',
        end_date: '2026-07-01',
        priority: 'high',
        budget: '45000.00',
        status: 'completed',
      });
    });
  });
});
