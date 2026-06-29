import { FormEvent, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReviewRating } from '../../../entities/review';
import { ReviewForm } from './review-form';

type ReviewPayloadForTest = {
  rating: ReviewRating;
  comment: string;
};

type ReviewFormHarnessProps = {
  initialRating?: ReviewRating;
  initialComment?: string;
  error?: string;
  onPayload?: ReturnType<typeof vi.fn>;
};

function ReviewFormHarness({
  initialRating = 5,
  initialComment = '',
  error = '',
  onPayload = vi.fn(),
}: ReviewFormHarnessProps) {
  const [rating, setRating] = useState<ReviewRating>(initialRating);
  const [comment, setComment] = useState(initialComment);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: ReviewPayloadForTest = {
      rating,
      comment: comment.trim(),
    };

    onPayload(payload);
  }

  return (
    <ReviewForm
      title="Leave a review"
      rating={rating}
      comment={comment}
      error={error}
      isSubmitting={false}
      submitLabel="Create review"
      onRatingChange={setRating}
      onCommentChange={setComment}
      onSubmit={handleSubmit}
      onCancel={vi.fn()}
    />
  );
}

describe('ReviewForm', () => {
  it('renders rating choices and preserves current optional comment behavior', async () => {
    const user = userEvent.setup();
    const onPayload = vi.fn();

    render(<ReviewFormHarness onPayload={onPayload} />);

    expect(screen.getByLabelText('Rating')).toHaveValue('5');
    expect(screen.getByRole('option', { name: '1' })).toHaveValue('1');
    expect(screen.getByRole('option', { name: '5' })).toHaveValue('5');

    await user.click(screen.getByRole('button', { name: 'Create review' }));

    expect(onPayload).toHaveBeenCalledWith({
      rating: 5,
      comment: '',
    });
  });

  it('submits expected trimmed payload', async () => {
    const user = userEvent.setup();
    const onPayload = vi.fn();

    render(<ReviewFormHarness onPayload={onPayload} />);

    await user.selectOptions(screen.getByLabelText('Rating'), '3');
    await user.type(screen.getByLabelText('Comment'), '  Great project delivery.  ');
    await user.click(screen.getByRole('button', { name: 'Create review' }));

    expect(onPayload).toHaveBeenCalledWith({
      rating: 3,
      comment: 'Great project delivery.',
    });
  });

  it('displays submit errors provided by the parent flow', () => {
    render(<ReviewFormHarness error="Review could not be created. Please try again." />);

    expect(screen.getByText('Review could not be created. Please try again.')).toBeInTheDocument();
  });

  it('disables fields and shows saving label while submitting', () => {
    render(
      <ReviewForm
        title="Leave a review"
        rating={5}
        comment="Pending"
        error=""
        isSubmitting
        submitLabel="Create review"
        onRatingChange={vi.fn()}
        onCommentChange={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Rating')).toBeDisabled();
    expect(screen.getByLabelText('Comment')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });
});
