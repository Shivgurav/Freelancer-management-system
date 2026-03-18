import { apiFetch } from "./config";

export function notifyBid(bidData) {
  return apiFetch("/notify/bid", {
    method: "POST",
    body: JSON.stringify(bidData),
  });
}

export function notifyContract(contractData) {
  return apiFetch("/notify/contract", {
    method: "POST",
    body: JSON.stringify(contractData),
  });
}

export function notifyReport(reportData) {
  return apiFetch("/notify/report", {
    method: "POST",
    body: JSON.stringify(reportData),
  });
}

export function getMyNotifications() {
  return apiFetch("/notifications/me");
}
