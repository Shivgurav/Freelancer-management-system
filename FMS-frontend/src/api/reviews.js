import { apiFetch } from "./config";

// POST /api/reviews  (CLIENT or FREELANCER)
// body: { contractId, revieweeId, rating, comment }
export function submitReview(reviewData) {
  return apiFetch("/reviews", {
    method: "POST",
    body: JSON.stringify(reviewData),
  });
}

// GET /api/reviews/user/{userId}  — reviews received by a user (public)
export function getReviewsForUser(userId) {
  return apiFetch(`/reviews/user/${userId}`);
}

// GET /api/reviews/contract/{contractId}  (CLIENT or FREELANCER)
export function getReviewsForContract(contractId) {
  return apiFetch(`/reviews/contract/${contractId}`);
}

// GET /api/reviews/my-reviews  (CLIENT or FREELANCER) — reviews I wrote
export function getMyReviews() {
  return apiFetch("/reviews/my-reviews");
}
