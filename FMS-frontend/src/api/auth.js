import { apiFetch, setTokens, clearTokens, GATEWAY_URL, getAccessToken } from "./config";

// POST /api/auth/register
// Returns AuthResponse: { accessToken, refreshToken, tokenType, user: { id, email, firstName, lastName, role } }
export async function register({ firstName, lastName, email, password, role }) {
  const data = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ firstName, lastName, email, password, role }),
  });
  if (data.accessToken) setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data;
}

// POST /api/auth/login
// Returns AuthResponse: { accessToken, refreshToken, tokenType, user: { id, email, firstName, lastName, role } }
export async function login({ email, password }) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data.accessToken) setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data;
}

// POST /api/auth/logout  — body: { refreshToken }
// Uses raw fetch instead of apiFetch to avoid the 401-retry loop:
// the server invalidates the token immediately, so any retry with the
// same token would also fail. We clear tokens regardless of response.
export async function logout(refreshToken) {
  try {
    const token = getAccessToken();
    await fetch(`${GATEWAY_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // Network error — doesn't matter, we clear tokens anyway
  } finally {
    clearTokens();
  }
}

// POST /api/auth/refresh
export async function refreshToken(token) {
  const data = await apiFetch("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken: token }),
  });
  if (data.accessToken) setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data;
}

// NOTE: GET /api/auth/me is intentionally NOT used from the frontend.
// The API Gateway strips the Authorization header before forwarding to the
// auth service, so calling /api/auth/me from the browser results in 403.
// Instead, the store decodes the JWT payload directly (no network call needed).

// GET /api/auth/user/{userId} — internal user info lookup
export function getUserById(userId) {
  return apiFetch(`/auth/user/${userId}`);
}
