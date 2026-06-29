import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '../../../shared/api';
import { TransactionForm } from './transaction-form';

function renderTransactionForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(
    <TransactionForm
      mode="create"
      transaction={null}
      onSubmit={onSubmit}
      onCancel={vi.fn()}
    />,
  );

  return { onSubmit };
}

function submitTransactionForm() {
  fireEvent.submit(screen.getByRole('button', { name: 'Create transaction' }).closest('form') as HTMLFormElement);
}

describe('TransactionForm', () => {
  it('rejects missing and invalid amount values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    renderTransactionForm(onSubmit);

    submitTransactionForm();
    expect(screen.getByText('Amount must be a positive number.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Amount'), '0');
    await user.type(screen.getByLabelText('Description'), 'Manual income');
    submitTransactionForm();
    expect(screen.getByText('Amount must be a positive number.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects missing description according to current behavior', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    renderTransactionForm(onSubmit);

    await user.type(screen.getByLabelText('Amount'), '1000');
    submitTransactionForm();

    expect(screen.getByText('Description is required.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('trims payload values on submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    renderTransactionForm(onSubmit);

    await user.type(screen.getByLabelText('Amount'), ' 1000.00 ');
    await user.selectOptions(screen.getByLabelText('Type'), 'expense');
    await user.selectOptions(screen.getByLabelText('Currency'), 'CAD');
    await user.type(screen.getByLabelText('Description'), '  Materials  ');
    await user.click(screen.getByRole('button', { name: 'Create transaction' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        amount: '1000.00',
        transaction_type: 'expense',
        currency: 'CAD',
        description: 'Materials',
      });
    });
  });

  it('displays API error from a rejected submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new ApiError('Validation failed.', 400, {
      amount: ['Must be less than 1000.'],
    }));

    renderTransactionForm(onSubmit);

    await user.type(screen.getByLabelText('Amount'), '1000');
    await user.type(screen.getByLabelText('Description'), 'Manual income');
    await user.click(screen.getByRole('button', { name: 'Create transaction' }));

    expect(await screen.findByText('amount: Must be less than 1000.')).toBeInTheDocument();
  });
});
