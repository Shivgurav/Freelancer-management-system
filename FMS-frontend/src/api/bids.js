import { apiFetch } from "./config";

// POST /api/bids/job/{jobId}/client/{clientId}  (FREELANCER only)
// body: { bidAmount, coverLetter, estimatedDays }
export function submitBid(jobId, clientId, bidData) {
  return apiFetch(`/bids/job/${jobId}/client/${clientId}`, {
    method: "POST",
    body: JSON.stringify(bidData),
  });
}

// GET /api/bids/job/{jobId}  (CLIENT only)
export function getBidsForJob(jobId) {
  return apiFetch(`/bids/job/${jobId}`);
}

// GET /api/bids/my-bids  (FREELANCER only)
export function getMyBids() {
  return apiFetch("/bids/my-bids");
}

// PATCH /api/bids/{bidId}/accept  (CLIENT only)
export function acceptBid(bidId) {
  return apiFetch(`/bids/${bidId}/accept`, { method: "PATCH" });
}

// PATCH /api/bids/{bidId}/reject  (CLIENT only)
export function rejectBid(bidId) {
  return apiFetch(`/bids/${bidId}/reject`, { method: "PATCH" });
}

// PATCH /api/bids/{bidId}/withdraw  (FREELANCER only)
export function withdrawBid(bidId) {
  return apiFetch(`/bids/${bidId}/withdraw`, { method: "PATCH" });
}
