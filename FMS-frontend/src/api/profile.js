import { apiFetch } from "./config";

// ── Freelancer ──────────────────────────────────────────────────────────────

// GET /api/profiles/freelancer/me
export function getMyFreelancerProfile() {
  return apiFetch("/profiles/freelancer/me");
}

// PUT /api/profiles/freelancer/me
// body: { title, bio, hourlyRate, location, yearsOfExperience, portfolioUrl, linkedinUrl, githubUrl }
export function updateFreelancerProfile(updates) {
  return apiFetch("/profiles/freelancer/me", {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

// GET /api/profiles/freelancer/{profileId}
export function getFreelancerProfileById(profileId) {
  return apiFetch(`/profiles/freelancer/${profileId}`);
}

// POST /api/profiles/freelancer/me/skills  — body: { name, category, proficiencyLevel }
export function addSkill(skill) {
  return apiFetch("/profiles/freelancer/me/skills", {
    method: "POST",
    body: JSON.stringify(skill),
  });
}

// DELETE /api/profiles/freelancer/me/skills/{skillId}
export function removeSkill(skillId) {
  return apiFetch(`/profiles/freelancer/me/skills/${skillId}`, { method: "DELETE" });
}

// GET /api/profiles/skills
export function getAllSkills() {
  return apiFetch("/profiles/skills");
}

// ── Client ──────────────────────────────────────────────────────────────────

// GET /api/profiles/client/me
export function getMyClientProfile() {
  return apiFetch("/profiles/client/me");
}

// PUT /api/profiles/client/me
// body: { firstName, lastName, companyName, description, industry, companySize, location, websiteUrl, linkedinUrl }
export function updateClientProfile(updates) {
  return apiFetch("/profiles/client/me", {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

// GET /api/profiles/client/{profileId}
export function getClientProfileById(profileId) {
  return apiFetch(`/profiles/client/${profileId}`);
}

// Generic helpers used by the store (role-aware)
export function getMyProfile(role) {
  if (role === "FREELANCER" || role === "freelancer") return getMyFreelancerProfile();
  return getMyClientProfile();
}

export function updateMyProfile(updates, role) {
  if (role === "FREELANCER" || role === "freelancer") return updateFreelancerProfile(updates);
  return updateClientProfile(updates);
}

// ── Profile Init (called by frontend after registration) ────────────────────
// These mirror the internal endpoints the auth service was supposed to call.
// The gateway allows them because the JWT filter injects X-User-Id from the token.
// Note: the controller reads X-User-Id from the header (injected by gateway),
// so no extra header needed — apiFetch sends the Bearer token and gateway injects it.

// POST /api/profiles/freelancer/init
export function initFreelancerProfile(firstName, lastName) {
  return apiFetch("/profiles/freelancer/init", {
    method: "POST",
    body: JSON.stringify({ title: `${firstName} ${lastName}`.trim() }),
  });
}

// POST /api/profiles/client/init
export function initClientProfile(firstName, lastName) {
  return apiFetch("/profiles/client/init", {
    method: "POST",
    body: JSON.stringify({ firstName, lastName }),
  });
}
