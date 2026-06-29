import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserProfile } from '../../../entities/user';
import { SalaryForm } from './salary-form';

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
];

function renderSalaryForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(
    <SalaryForm
      mode="create"
      salary={null}
      workers={workers}
      onSubmit={onSubmit}
      onCancel={vi.fn()}
    />,
  );

  return { onSubmit };
}

function submitSalaryForm() {
  fireEvent.submit(screen.getByRole('button', { name: 'Record salary' }).closest('form') as HTMLFormElement);
}

describe('SalaryForm', () => {
  it('validates required fields with current messages', async () => {
    const user = userEvent.setup();

    renderSalaryForm();

    submitSalaryForm();
    expect(screen.getByText('Worker is required.')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Worker'), '4');
    submitSalaryForm();
    expect(screen.getByText('Amount must be a positive number.')).toBeInTheDocument();
  });

  it('validates amount according to current behavior', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    renderSalaryForm(onSubmit);

    await user.selectOptions(screen.getByLabelText('Worker'), '4');
    await user.type(screen.getByLabelText('Amount'), '-1');
    submitSalaryForm();

    expect(screen.getByText('Amount must be a positive number.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('handles worker selection and submits expected payload', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    renderSalaryForm(onSubmit);

    await user.selectOptions(screen.getByLabelText('Worker'), '4');
    await user.type(screen.getByLabelText('Amount'), ' 1000.00 ');
    await user.selectOptions(screen.getByLabelText('Currency'), 'CAD');
    await user.click(screen.getByRole('button', { name: 'Record salary' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        worker: 4,
        amount: '1000.00',
        currency: 'CAD',
      });
    });
  });
});
