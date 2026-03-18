import { apiFetch } from "./config";

export function submitReview(reviewData) {
  return apiFetch("/reviews", {
    method: "POST",
    body: JSON.stringify(reviewData),
  });
}

export function getFreelancerReviews(freelancerId) {
  const params = freelancerId ? `?freelancerId=${freelancerId}` : "";
  return apiFetch(`/reviews/freelancer${params}`);
}

export function getClientReviews(clientId) {
  const params = clientId ? `?clientId=${clientId}` : "";
  return apiFetch(`/reviews/client${params}`);
}

export function getContractReviews(contractId) {
  return apiFetch(`/reviews/contract?contractId=${contractId}`);
}
