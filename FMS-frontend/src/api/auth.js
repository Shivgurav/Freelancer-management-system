import { apiFetch, setTokens, clearTokens } from "./config";

export async function register({ firstName, lastName, email, password, role }) {
  const data = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ firstName, lastName, email, password, role }),
  });
  if (data.accessToken) setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data;
}

export async function login({ email, password }) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data.accessToken) setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data;
}

export async function logout() {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } finally {
    clearTokens();
  }
}

export async function refreshToken() {
  const data = await apiFetch("/auth/refresh", { method: "POST" });
  if (data.accessToken) setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data;
}
