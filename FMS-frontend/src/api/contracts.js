import { apiFetch } from "./config";

export function getContractById(contractId) {
  return apiFetch(`/contracts/${contractId}`);
}

export function getMyContracts() {
  return apiFetch("/contracts/me");
}

export function createMilestone(milestoneData) {
  return apiFetch("/milestones", {
    method: "POST",
    body: JSON.stringify(milestoneData),
  });
}

export function submitProgressReport(reportData) {
  return apiFetch("/reports", {
    method: "POST",
    body: JSON.stringify(reportData),
  });
}

export function approveReport(reportId) {
  return apiFetch(`/reports/${reportId}/approve`, {
    method: "PUT",
  });
}
