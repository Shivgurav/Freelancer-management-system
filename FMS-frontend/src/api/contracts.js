import { apiFetch } from "./config";

// GET /api/contracts/{contractId}
export function getContractById(contractId) {
  return apiFetch(`/contracts/${contractId}`);
}

// GET /api/contracts/my-contracts  (CLIENT or FREELANCER)
export function getMyContracts() {
  return apiFetch("/contracts/my-contracts");
}

// PATCH /api/contracts/{contractId}/cancel
export function cancelContract(contractId) {
  return apiFetch(`/contracts/${contractId}/cancel`, { method: "PATCH" });
}

// ── Milestones ──────────────────────────────────────────────────────────────

// POST /api/milestones/contract/{contractId}  (CLIENT only)
// body: { title, description, amount, sequenceOrder }
export function addMilestone(contractId, milestoneData) {
  return apiFetch(`/milestones/contract/${contractId}`, {
    method: "POST",
    body: JSON.stringify(milestoneData),
  });
}

// GET /api/milestones/contract/{contractId}
export function getMilestonesForContract(contractId) {
  return apiFetch(`/milestones/contract/${contractId}`);
}

// PATCH /api/milestones/{milestoneId}/start  (FREELANCER only)
export function startMilestone(milestoneId) {
  return apiFetch(`/milestones/${milestoneId}/start`, { method: "PATCH" });
}

// PATCH /api/milestones/{milestoneId}/approve  (CLIENT only)
export function approveMilestone(milestoneId) {
  return apiFetch(`/milestones/${milestoneId}/approve`, { method: "PATCH" });
}

// PATCH /api/milestones/{milestoneId}/revision  (CLIENT only)
export function requestMilestoneRevision(milestoneId) {
  return apiFetch(`/milestones/${milestoneId}/revision`, { method: "PATCH" });
}

// ── Progress Reports ────────────────────────────────────────────────────────

// POST /api/reports/milestone/{milestoneId}  (FREELANCER only)
// body: { title, description, percentageComplete, attachmentUrls }
export function submitProgressReport(milestoneId, reportData) {
  return apiFetch(`/reports/milestone/${milestoneId}`, {
    method: "POST",
    body: JSON.stringify(reportData),
  });
}

// GET /api/reports/milestone/{milestoneId}
export function getProgressReports(milestoneId) {
  return apiFetch(`/reports/milestone/${milestoneId}`);
}

// PATCH /api/reports/{reportId}/approve  (CLIENT only)
export function approveReport(reportId) {
  return apiFetch(`/reports/${reportId}/approve`, { method: "PATCH" });
}

// PATCH /api/reports/{reportId}/revision  (CLIENT only)
// body: { feedback }
export function requestReportRevision(reportId, feedback) {
  return apiFetch(`/reports/${reportId}/revision`, {
    method: "PATCH",
    body: JSON.stringify({ feedback }),
  });
}

// POST /api/contracts  — internal endpoint, called after bid is accepted
// body: { jobId, bidId, clientId, freelancerId, agreedAmount, startDate, endDate, terms }
// startDate is required by ContractServiceImpl — send today's date to avoid NPE.
export function createContract(contractData) {
  const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
  return apiFetch("/contracts", {
    method: "POST",
    body: JSON.stringify({
      startDate: today,   // required — backend crashes with NPE if null
      endDate:   null,    // optional
      ...contractData,    // caller values override defaults
    }),
  });
}
