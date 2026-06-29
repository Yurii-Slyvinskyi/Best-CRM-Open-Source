import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, MessageSquareText, RotateCcw, Search, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatProjectDate, getProjects, type Project } from '../../entities/project';
import { getReviews, type Review, type ReviewRating } from '../../entities/review';
import { getApiErrorMessage } from '../../shared/api';
import { cn } from '../../shared/lib/cn';
import {
  DataTable,
  DataTableBody,
  DataTableEmptyRow,
  DataTableHeader,
  DataTableShell,
} from '../../shared/ui/data-table';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { LoadingState } from '../../shared/ui/loading-state';
import { PageShell } from '../../shared/ui/page-shell';

const ratingOptions: Array<{ value: '' | ReviewRating; label: string }> = [
  { value: '', label: 'All ratings' },
  { value: 1, label: '1 star' },
  { value: 2, label: '2 stars' },
  { value: 3, label: '3 stars' },
  { value: 4, label: '4 stars' },
  { value: 5, label: '5 stars' },
];

function RatingStars({ rating }: { rating: ReviewRating }) {
  return (
    <span className="inline-flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            'h-4 w-4',
            index < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300',
          )}
          aria-hidden="true"
        />
      ))}
      <span className="ml-1 text-sm font-semibold tabular-nums text-gray-700">{rating}/5</span>
    </span>
  );
}

export function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const [reviewsResult, projectsResult] = await Promise.allSettled([
        getReviews(),
        getProjects(),
      ]);

      if (reviewsResult.status === 'rejected') {
        throw reviewsResult.reason;
      }

      setReviews(reviewsResult.value);

      if (projectsResult.status === 'fulfilled') {
        setProjects(projectsResult.value);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Reviews could not be loaded. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  function getProjectLabel(projectId: number) {
    const project = projects.find((currentProject) => currentProject.id === projectId);
    return project ? project.name : `Project #${projectId}`;
  }

  function resetFilters() {
    setSearch('');
    setRatingFilter('');
  }

  const filteredReviews = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return reviews.filter((review) => {
      const projectLabel = getProjectLabel(review.project);
      const matchesSearch = !normalizedSearch || [
        projectLabel,
        review.comment,
        review.client,
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
      const matchesRating = !ratingFilter || review.rating === Number(ratingFilter);

      return matchesSearch && matchesRating;
    });
  }, [projects, ratingFilter, reviews, search]);

  const hasActiveFilters = Boolean(search || ratingFilter);

  return (
    <PageShell
      eyebrow="CRM REVIEWS"
      title="Reviews"
      subtitle="Your project feedback and completed work ratings."
      width="wide"
    >
      {isLoading && (
        <LoadingState
          title="Loading reviews"
          description="Fetching your project reviews and project labels."
        />
      )}

      {!isLoading && error && (
        <ErrorState title="Unable to load reviews" message={error} />
      )}

      {!isLoading && !error && reviews.length === 0 && (
        <EmptyState
          icon={MessageSquareText}
          title="No reviews found"
          description="Reviews you submit from project detail pages will appear here."
        />
      )}

      {!isLoading && !error && reviews.length > 0 && (
        <>
          <div className="rounded-lg border border-gray-300 bg-white p-3 shadow-md">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex h-10 min-w-[12.5rem] flex-1 items-center gap-2 rounded-md border border-gray-300 px-3 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
                <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search reviews"
                  className="min-w-0 flex-1 text-sm text-gray-950 outline-none"
                  placeholder="Search project, comment or client…"
                />
              </div>

              <select
                value={ratingFilter}
                onChange={(event) => setRatingFilter(event.target.value)}
                aria-label="Filter by rating"
                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                {ratingOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-transparent px-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
              <p className="text-sm text-gray-600">
                Showing <strong className="font-semibold text-gray-950">{filteredReviews.length}</strong> of{' '}
                <strong className="font-semibold text-gray-950">{reviews.length}</strong> reviews
              </p>
            </div>
          </div>

          <DataTableShell>
            <DataTable>
              <DataTableHeader>
                <tr>
                  <th className="min-w-[14rem] px-4 py-4">Project</th>
                  <th className="min-w-[10rem] px-4 py-4">Rating</th>
                  <th className="min-w-[24rem] px-4 py-4">Comment</th>
                  <th className="min-w-[12rem] px-4 py-4">Created at</th>
                  <th className="min-w-[10rem] px-4 py-4">Action</th>
                </tr>
              </DataTableHeader>
              <DataTableBody>
                {filteredReviews.length === 0 && (
                  <DataTableEmptyRow colSpan={5} message="No reviews match the current filters." />
                )}
                {filteredReviews.map((review) => (
                  <tr key={review.id}>
                    <td className="min-w-[14rem] break-words px-4 py-4 font-semibold text-gray-950">
                      {getProjectLabel(review.project)}
                    </td>
                    <td className="min-w-[10rem] px-4 py-4">
                      <RatingStars rating={review.rating} />
                    </td>
                    <td className="min-w-[24rem] break-words px-4 py-4 leading-6 text-gray-700">
                      {review.comment || 'No written comment.'}
                    </td>
                    <td className="min-w-[12rem] px-4 py-4 text-gray-700">
                      {formatProjectDate(review.created_at)}
                    </td>
                    <td className="min-w-[10rem] px-4 py-4">
                      <Link
                        to={`/projects/${review.project}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        Open project
                      </Link>
                    </td>
                  </tr>
                ))}
              </DataTableBody>
            </DataTable>
          </DataTableShell>
        </>
      )}
    </PageShell>
  );
}
