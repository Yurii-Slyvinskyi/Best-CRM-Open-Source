import type { FormEvent } from 'react';
import { Pencil, Star, Trash2 } from 'lucide-react';
import { formatProjectDate } from '../../../entities/project';
import type { Review, ReviewRating } from '../../../entities/review';
import { EmptyState } from '../../../shared/ui/empty-state';
import { ErrorState } from '../../../shared/ui/error-state';
import { FormError } from '../../../shared/ui/form';
import { LoadingState } from '../../../shared/ui/loading-state';
import { cn } from '../../../shared/lib/cn';
import { getInitials } from '../lib/project-detail-helpers';
import { ReviewForm } from './review-form';
import { SectionPanel } from './section-panel';

type ReviewPanelProps = {
  review: Review | undefined;
  canManageReview: boolean;
  isLoading: boolean;
  error: string;
  isEditing: boolean;
  rating: ReviewRating;
  comment: string;
  formError: string;
  isSubmitting: boolean;
  isDeleting: boolean;
  onRatingChange: (rating: ReviewRating) => void;
  onCommentChange: (comment: string) => void;
  onCreateSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
};

export function ReviewPanel({
  review,
  canManageReview,
  isLoading,
  error,
  isEditing,
  rating,
  comment,
  formError,
  isSubmitting,
  isDeleting,
  onRatingChange,
  onCommentChange,
  onCreateSubmit,
  onUpdateSubmit,
  onStartEdit,
  onCancelEdit,
  onDelete,
}: ReviewPanelProps) {
  return (
    <SectionPanel icon={Star} title="Client review">
      {isLoading && <LoadingState title="Loading review" compact />}
      {!isLoading && error && (
        <ErrorState title="Unable to load review" message={error} />
      )}
      {!isLoading && !error && !review && canManageReview && (
        <ReviewForm
          title="Write review"
          rating={rating}
          comment={comment}
          error={formError}
          isSubmitting={isSubmitting}
          submitLabel="Submit review"
          onRatingChange={onRatingChange}
          onCommentChange={onCommentChange}
          onSubmit={onCreateSubmit}
        />
      )}
      {!isLoading && !error && !review && !canManageReview && (
        <EmptyState
          icon={Star}
          title="No review yet"
          description="No review is visible for this project."
          compact
        />
      )}
      {!isLoading && !error && review && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[12.5px] font-semibold text-blue-800">
                {getInitials(review.client)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-semibold text-gray-950">{review.client}</p>
                <p className="text-xs text-gray-400">
                  {formatProjectDate(review.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={cn(
                    'h-[18px] w-[18px]',
                    index < Math.round(review.rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300',
                  )}
                  aria-hidden="true"
                />
              ))}
              <span className="ml-1.5 text-[13px] font-semibold tabular-nums text-gray-700">
                {review.rating}/5
              </span>
            </div>
          </div>
          <p className="mt-4 break-words text-sm italic leading-relaxed text-gray-700">
            “{review.comment || 'No written comment.'}”
          </p>
          {canManageReview && !isEditing && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onStartEdit}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting || isSubmitting}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
          {canManageReview && !isEditing && formError && (
            <div className="mt-4">
              <FormError message={formError} />
            </div>
          )}
          {canManageReview && isEditing && (
            <div className="mt-5 rounded-md border border-gray-200 bg-gray-50 p-4">
              <ReviewForm
                title="Edit review"
                rating={rating}
                comment={comment}
                error={formError}
                isSubmitting={isSubmitting}
                submitLabel="Save review"
                onRatingChange={onRatingChange}
                onCommentChange={onCommentChange}
                onSubmit={onUpdateSubmit}
                onCancel={onCancelEdit}
              />
            </div>
          )}
        </div>
      )}
    </SectionPanel>
  );
}
