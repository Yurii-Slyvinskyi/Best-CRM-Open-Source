import type { FormEvent } from 'react';
import type { ReviewRating } from '../../../entities/review';
import { FormError } from '../../../shared/ui/form';

type ReviewFormProps = {
  title: string;
  rating: ReviewRating;
  comment: string;
  error: string;
  isSubmitting: boolean;
  submitLabel: string;
  onRatingChange: (rating: ReviewRating) => void;
  onCommentChange: (comment: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
};

export function ReviewForm({
  title,
  rating,
  comment,
  error,
  isSubmitting,
  submitLabel,
  onRatingChange,
  onCommentChange,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <p className="text-sm font-semibold text-gray-950">{title}</p>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          Rate the project from 1 to 5 and add an optional comment.
        </p>
      </div>

      {error && <FormError message={error} />}

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Rating</span>
        <select
          value={rating}
          onChange={(event) => onRatingChange(Number(event.target.value) as ReviewRating)}
          className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          disabled={isSubmitting}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Comment</span>
        <textarea
          value={comment}
          onChange={(event) => onCommentChange(event.target.value)}
          className="mt-2 min-h-28 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          disabled={isSubmitting}
        />
      </label>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950 disabled:cursor-not-allowed disabled:text-gray-300"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-10 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
