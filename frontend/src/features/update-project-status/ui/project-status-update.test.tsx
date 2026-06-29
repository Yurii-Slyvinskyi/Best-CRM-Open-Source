import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Project } from '../../../entities/project';
import { ApiError } from '../../../shared/api';
import { ProjectStatusUpdate } from './project-status-update';

const projectMocks = vi.hoisted(() => ({
  updateProjectStatus: vi.fn(),
}));

vi.mock('../../../entities/project', () => projectMocks);

const updatedProject: Project = {
  id: 7,
  name: 'Lakeview Renovation',
  description: 'Kitchen work',
  status: 'completed',
  assigned_team: [3],
  client: 12,
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
};

describe('ProjectStatusUpdate', () => {
  beforeEach(() => {
    projectMocks.updateProjectStatus.mockReset();
  });

  it('renders allowed status options and disables submit for the current status', () => {
    render(
      <ProjectStatusUpdate
        projectId={7}
        currentStatus="assigned"
        onUpdated={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Status')).toHaveValue('assigned');
    expect(screen.getByRole('option', { name: 'Pending' })).toHaveValue('pending');
    expect(screen.getByRole('option', { name: 'Assigned' })).toHaveValue('assigned');
    expect(screen.getByRole('option', { name: 'Cancelled' })).toHaveValue('cancelled');
    expect(screen.getByRole('option', { name: 'Partially completed' })).toHaveValue('partially completed');
    expect(screen.getByRole('option', { name: 'Completed' })).toHaveValue('completed');
    expect(screen.getByRole('button', { name: 'Status is current' })).toBeDisabled();
  });

  it('submits the selected status and reports success', async () => {
    const user = userEvent.setup();
    const onUpdated = vi.fn();

    projectMocks.updateProjectStatus.mockResolvedValue(updatedProject);

    render(
      <ProjectStatusUpdate
        projectId="7"
        currentStatus="assigned"
        onUpdated={onUpdated}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Status'), 'completed');
    await user.click(screen.getByRole('button', { name: 'Save status' }));

    await waitFor(() => {
      expect(projectMocks.updateProjectStatus).toHaveBeenCalledWith('7', 'completed');
    });
    expect(onUpdated).toHaveBeenCalledWith(updatedProject);
    expect(screen.getByText('Project status updated.')).toBeInTheDocument();
  });

  it('displays API errors from a rejected submit', async () => {
    const user = userEvent.setup();

    projectMocks.updateProjectStatus.mockRejectedValue(new ApiError('Only assigned projects can be completed.', 403, null));

    render(
      <ProjectStatusUpdate
        projectId={7}
        currentStatus="assigned"
        onUpdated={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Status'), 'completed');
    await user.click(screen.getByRole('button', { name: 'Save status' }));

    expect(await screen.findByText('Permission denied: Only assigned projects can be completed.')).toBeInTheDocument();
  });
});
