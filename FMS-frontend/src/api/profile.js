import { apiFetch } from "./config";

export function getMyProfile() {
  return apiFetch("/profile/me");
}

export function updateMyProfile(updates) {
  return apiFetch("/profile/me", {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export function addSkills(skills) {
  return apiFetch("/profile/skills", {
    method: "POST",
    body: JSON.stringify({ skills }),
  });
}

export function addPortfolioItem(item) {
  return apiFetch("/profile/portfolio", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export function getProfileById(userId) {
  return apiFetch(`/profile/${userId}`);
}
