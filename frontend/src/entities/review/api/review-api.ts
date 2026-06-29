import { apiClient } from '../../../shared/api';
import type { Review, ReviewPayload, ReviewUpdatePayload } from '../model/types';

export function getReviews(): Promise<Review[]> {
  return apiClient<Review[]>('/api/reviews/');
}

export function getReview(reviewId: string | number): Promise<Review> {
  return apiClient<Review>(`/api/reviews/${reviewId}/`);
}

export function createReview(payload: ReviewPayload): Promise<Review> {
  return apiClient<Review>('/api/reviews/', {
    method: 'POST',
    body: payload,
  });
}

export function updateReview(
  reviewId: string | number,
  payload: ReviewUpdatePayload,
): Promise<Review> {
  return apiClient<Review>(`/api/reviews/${reviewId}/`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteReview(reviewId: string | number): Promise<void> {
  return apiClient<void>(`/api/reviews/${reviewId}/`, {
    method: 'DELETE',
  });
}
