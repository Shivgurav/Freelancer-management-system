import { apiFetch } from "./config";

export function getJobAnalytics() {
  return apiFetch("/analytics/jobs");
}

export function getFreelancerAnalytics() {
  return apiFetch("/analytics/freelancers");
}

export function getBidAnalytics() {
  return apiFetch("/analytics/bids");
}

export function getOverviewAnalytics() {
  return apiFetch("/analytics/overview");
}
