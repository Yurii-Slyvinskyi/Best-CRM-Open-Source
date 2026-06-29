import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Team } from '../../../entities/team';
import type { UserProfile } from '../../../entities/user';
import { ApiError } from '../../../shared/api';
import { TeamForm } from './team-form';

const workers: UserProfile[] = [
  {
    id: 4,
    username: 'worker_one',
    email: 'worker@example.com',
    role: 'worker',
    phone: null,
    address: null,
    company: 'Acme',
  },
  {
    id: 9,
    username: 'worker_two',
    email: 'worker-two@example.com',
    role: 'worker',
    phone: null,
    address: null,
    company: 'Acme',
  },
];

const existingTeam: Team = {
  id: 12,
  name: 'Existing crew',
  company: 1,
  workers: [4, 99],
};

function renderTeamForm({
  mode = 'create',
  team = null,
  onSubmit = vi.fn().mockResolvedValue(undefined),
}: {
  mode?: 'create' | 'edit';
  team?: Team | null;
  onSubmit?: ReturnType<typeof vi.fn>;
} = {}) {
  render(
    <TeamForm
      mode={mode}
      team={team}
      workers={workers}
      onSubmit={onSubmit}
      onCancel={vi.fn()}
    />,
  );

  return { onSubmit };
}

function submitTeamForm(buttonName = 'Create team') {
  fireEvent.submit(screen.getByRole('button', { name: buttonName }).closest('form') as HTMLFormElement);
}

describe('TeamForm', () => {
  it('validates required name with the current message', () => {
    const { onSubmit } = renderTeamForm();

    submitTeamForm();

    expect(screen.getByText('Team name is required.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('toggles worker selection and submits expected payload', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    renderTeamForm({ onSubmit });

    await user.type(screen.getByLabelText('Name'), '  Alpha crew  ');
    await user.click(screen.getByLabelText('worker_one #4'));
    await user.click(screen.getByLabelText('worker_two #9'));
    await user.click(screen.getByLabelText('worker_two #9'));
    await user.click(screen.getByRole('button', { name: 'Create team' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Alpha crew',
        workers: [4],
      });
    });
  });

  it('renders edit values, preserves unknown assigned workers, and submits edit payload', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    renderTeamForm({ mode: 'edit', team: existingTeam, onSubmit });

    expect(screen.getByLabelText('Name')).toHaveValue('Existing crew');
    expect(screen.getByLabelText('worker_one #4')).toBeChecked();
    expect(screen.getByLabelText('Worker #99')).toBeChecked();

    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), '  Updated crew  ');
    await user.click(screen.getByLabelText('worker_two #9'));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Updated crew',
        workers: [4, 99, 9],
      });
    });
  });

  it('displays submit errors from a rejected save', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new ApiError('Validation failed.', 400, {
      name: ['Already exists.'],
    }));

    renderTeamForm({ onSubmit });

    await user.type(screen.getByLabelText('Name'), 'Alpha crew');
    await user.click(screen.getByRole('button', { name: 'Create team' }));

    expect(await screen.findByText('name: Already exists.')).toBeInTheDocument();
  });
});
