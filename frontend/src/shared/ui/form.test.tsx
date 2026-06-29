import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormActions } from './form';

describe('FormActions', () => {
  it('shows the pending label while submitting', () => {
    render(
      <FormActions
        submitLabel="Save changes"
        submitPendingLabel="Saving..."
        isSubmitting
      />,
    );

    expect(screen.getByRole('button', { name: /Saving.../ })).toBeInTheDocument();
  });

  it('disables submit while saving or explicitly disabled', () => {
    const { rerender } = render(
      <FormActions
        submitLabel="Save changes"
        isSubmitting
      />,
    );

    expect(screen.getByRole('button', { name: /Save changes/ })).toBeDisabled();

    rerender(
      <FormActions
        submitLabel="Save changes"
        isSubmitDisabled
      />,
    );

    expect(screen.getByRole('button', { name: /Save changes/ })).toBeDisabled();
  });

  it('renders cancel only when a cancel callback exists', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const { rerender } = render(
      <FormActions
        submitLabel="Save changes"
      />,
    );

    expect(screen.queryByRole('button', { name: /Cancel/ })).not.toBeInTheDocument();

    rerender(
      <FormActions
        submitLabel="Save changes"
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Cancel/ }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
