import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Project } from '../../../entities/project';
import type { UserProfile } from '../../../entities/user';
import { ApiError } from '../../../shared/api';
import { PaymentForm } from './payment-form';

const clients: UserProfile[] = [
  {
    id: 100,
    username: 'client_one',
    email: 'client@example.com',
    role: 'client',
    phone: null,
    address: null,
    company: 'Acme',
  },
];

const projects: Project[] = [
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

function renderPaymentForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(
    <PaymentForm
      mode="create"
      payment={null}
      clients={clients}
      projects={projects}
      onSubmit={onSubmit}
      onCancel={vi.fn()}
    />,
  );

  return { onSubmit };
}

function submitPaymentForm() {
  fireEvent.submit(screen.getByRole('button', { name: 'Create payment' }).closest('form') as HTMLFormElement);
}

describe('PaymentForm', () => {
  it('validates required fields with current messages', async () => {
    const user = userEvent.setup();

    renderPaymentForm();

    submitPaymentForm();
    expect(screen.getByText('Client is required.')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Client'), '100');
    submitPaymentForm();
    expect(screen.getByText('Project is required.')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Project'), '10');
    submitPaymentForm();
    expect(screen.getByText('Amount must be a positive number.')).toBeInTheDocument();
  });

  it('validates amount according to current behavior', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    renderPaymentForm(onSubmit);

    await user.selectOptions(screen.getByLabelText('Client'), '100');
    await user.selectOptions(screen.getByLabelText('Project'), '10');
    await user.type(screen.getByLabelText('Amount'), '0');
    submitPaymentForm();

    expect(screen.getByText('Amount must be a positive number.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits expected trimmed normalized payload', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    renderPaymentForm(onSubmit);

    await user.selectOptions(screen.getByLabelText('Client'), '100');
    await user.selectOptions(screen.getByLabelText('Project'), '10');
    await user.type(screen.getByLabelText('Amount'), ' 500.00 ');
    await user.selectOptions(screen.getByLabelText('Currency'), 'CAD');
    await user.click(screen.getByRole('button', { name: 'Create payment' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        client: 100,
        project: 10,
        amount: '500.00',
        currency: 'CAD',
      });
    });
  });

  it('displays API error from a rejected submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new ApiError('Validation failed.', 400, {
      amount: ['Must be less than 1000.'],
    }));

    renderPaymentForm(onSubmit);

    await user.selectOptions(screen.getByLabelText('Client'), '100');
    await user.selectOptions(screen.getByLabelText('Project'), '10');
    await user.type(screen.getByLabelText('Amount'), '500');
    await user.click(screen.getByRole('button', { name: 'Create payment' }));

    expect(await screen.findByText('amount: Must be less than 1000.')).toBeInTheDocument();
  });
});
