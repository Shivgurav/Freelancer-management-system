import { apiFetch } from "./config";

// POST /api/jobs  (CLIENT only)
// body: { title, description, budgetMin, budgetMax, durationDays, experienceLevel, requiredSkills[] }
export function createJob(jobData) {
  return apiFetch("/jobs", {
    method: "POST",
    body: JSON.stringify(jobData),
  });
}

// GET /api/jobs  — returns List<JobResponse> (no pagination wrapper)
export function getAllOpenJobs() {
  return apiFetch("/jobs");
}

// GET /api/jobs/{jobId}
export function getJobById(jobId) {
  return apiFetch(`/jobs/${jobId}`);
}

// GET /api/jobs/my-jobs  (CLIENT only)
export function getMyJobs() {
  return apiFetch("/jobs/my-jobs");
}

// GET /api/jobs/search?keyword=xxx
export function searchJobsByTitle(keyword) {
  return apiFetch(`/jobs/search?keyword=${encodeURIComponent(keyword)}`);
}

// GET /api/jobs/search/skill?skill=xxx
export function searchJobsBySkill(skill) {
  return apiFetch(`/jobs/search/skill?skill=${encodeURIComponent(skill)}`);
}

// PATCH /api/jobs/{jobId}/cancel  (CLIENT only)
export function cancelJob(jobId) {
  return apiFetch(`/jobs/${jobId}/cancel`, { method: "PATCH" });
}
