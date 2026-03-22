import { apiFetch } from "./config";

// GET /api/notifications/my-notifications  (authenticated user)
// Returns list of notifications for the current user's email
export function getMyNotifications() {
  return apiFetch("/notifications/my-notifications");
}
