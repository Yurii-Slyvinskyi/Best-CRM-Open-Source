import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './modal';

describe('Modal', () => {
  it('renders title and children', () => {
    render(
      <Modal title="Edit record">
        <p>Modal content</p>
      </Modal>,
    );

    expect(screen.getByRole('heading', { name: 'Edit record' })).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('calls onClose when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <Modal title="Edit record" onClose={onClose}>
        <p>Modal content</p>
      </Modal>,
    );

    await user.click(container.firstElementChild as HTMLElement);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when content inside the modal is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal title="Edit record" onClose={onClose}>
        <button type="button">Inside action</button>
      </Modal>,
    );

    await user.click(screen.getByRole('button', { name: 'Inside action' }));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('allows backdrop clicks when no onClose callback is provided', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Modal title="Read only">
        <p>Modal content</p>
      </Modal>,
    );

    await user.click(container.firstElementChild as HTMLElement);

    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });
});
