import { apiFetch } from "./config";

export function createJob(jobData) {
  return apiFetch("/jobs", {
    method: "POST",
    body: JSON.stringify(jobData),
  });
}

export function getJobs({ skill, budget, page = 0, size = 20 } = {}) {
  const params = new URLSearchParams();
  if (skill) params.set("skill", skill);
  if (budget) params.set("budget", budget);
  params.set("page", page);
  params.set("size", size);
  return apiFetch(`/jobs?${params.toString()}`);
}

export function getJobById(jobId) {
  return apiFetch(`/jobs/${jobId}`);
}

export function submitBid(jobId, bidData) {
  return apiFetch(`/jobs/${jobId}/bids`, {
    method: "POST",
    body: JSON.stringify(bidData),
  });
}

export function acceptBid(bidId) {
  return apiFetch(`/bids/${bidId}/accept`, {
    method: "PUT",
  });
}

export function getMyBids() {
  return apiFetch("/bids/me");
}

export function getBidsForJob(jobId) {
  return apiFetch(`/jobs/${jobId}/bids`);
}
