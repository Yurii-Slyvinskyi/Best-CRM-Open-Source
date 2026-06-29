export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export type Review = {
  id: number;
  project: number;
  client: string;
  rating: ReviewRating;
  comment: string;
  created_at: string;
};

export type ReviewPayload = {
  project: number;
  rating: ReviewRating;
  comment?: string;
};

export type ReviewUpdatePayload = Partial<ReviewPayload>;
