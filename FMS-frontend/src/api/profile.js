import { apiFetch } from "./config";

// ── Freelancer ──────────────────────────────────────────────────────────────

export function getMyFreelancerProfile() {
  return apiFetch("/profiles/freelancer/me");
}

export function updateFreelancerProfile(updates) {
  return apiFetch("/profiles/freelancer/me", {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export function getFreelancerProfileById(profileId) {
  return apiFetch(`/profiles/freelancer/${profileId}`);
}

// ── Skills ─────────────────────────────────────────────────────────────────

export function addSkill(skill) {
  return apiFetch("/profiles/freelancer/me/skills", {
    method: "POST",
    body: JSON.stringify(skill),
  });
}

export function removeSkill(skillId) {
  return apiFetch(`/profiles/freelancer/me/skills/${skillId}`, { method: "DELETE" });
}

export function getAllSkills() {
  return apiFetch("/profiles/skills");
}

export function searchSkills(keyword) {
  return apiFetch(`/profiles/skills/search?keyword=${encodeURIComponent(keyword)}`);
}

// ── Client ──────────────────────────────────────────────────────────────────

export function getMyClientProfile() {
  return apiFetch("/profiles/client/me");
}

export function updateClientProfile(updates) {
  return apiFetch("/profiles/client/me", {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export function getClientProfileById(profileId) {
  return apiFetch(`/profiles/client/${profileId}`);
}

// ── Generic helpers ─────────────────────────────────────────────────────────

export function getMyProfile(role) {
  if (role === "FREELANCER" || role === "freelancer") return getMyFreelancerProfile();
  return getMyClientProfile();
}

export function updateMyProfile(updates, role) {
  if (role === "FREELANCER" || role === "freelancer") return updateFreelancerProfile(updates);
  return updateClientProfile(updates);
}

// ── Profile Init ─────────────────────────────────────────────────────────────

export function initFreelancerProfile(firstName, lastName) {
  return apiFetch("/profiles/freelancer/init", {
    method: "POST",
    body: JSON.stringify({ title: `${firstName} ${lastName}`.trim() }),
  });
}

export function initClientProfile(firstName, lastName) {
  return apiFetch("/profiles/client/init", {
    method: "POST",
    body: JSON.stringify({ firstName, lastName }),
  });
}
