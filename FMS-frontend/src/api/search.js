import { apiFetch } from "./config";

// POST /api/search/freelancers
// { skill, keyword, minRate, maxRate, minRating, availability, location, page, size, sortBy }
export function searchFreelancers(filters = {}) {
  return apiFetch("/search/freelancers", {
    method: "POST",
    body: JSON.stringify({ page: 0, size: 20, sortBy: "rating", ...filters }),
  });
}

// POST /api/search/jobs
// { skill, keyword, minBudget, maxBudget, experienceLevel, page, size }
export function searchJobs(filters = {}) {
  return apiFetch("/search/jobs", {
    method: "POST",
    body: JSON.stringify({ page: 0, size: 20, ...filters }),
  });
}

// GET /api/search/freelancers/top-rated?page=0&size=10
export function getTopRatedFreelancers(page = 0, size = 10) {
  return apiFetch(`/search/freelancers/top-rated?page=${page}&size=${size}`);
}

// GET /api/search/jobs/latest?page=0&size=10
export function getLatestJobs(page = 0, size = 10) {
  return apiFetch(`/search/jobs/latest?page=${page}&size=${size}`);
}
