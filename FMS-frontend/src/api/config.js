const GATEWAY_URL = "http://192.168.0.140:8080/api";

function getAccessToken() {
  return localStorage.getItem("access_token");
}

function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem("access_token", accessToken);
  if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
}

function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token available");

  const res = await fetch(`${GATEWAY_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearTokens();
    throw new Error("Session expired — please log in again");
  }

  const data = await res.json();
  setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data.accessToken;
}

async function apiFetch(path, options = {}) {
  const url = `${GATEWAY_URL}${path}`;
  const token = getAccessToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    try {
      const newToken = await refreshAccessToken();
      const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
      res = await fetch(url, { ...options, headers: retryHeaders });
    } catch {
      clearTokens();
      window.location.href = "/login";
      throw new Error("Session expired");
    }
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      message = body.message || body.error || message;
    } catch {}
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

async function apiUpload(path, formData) {
  const url = `${GATEWAY_URL}${path}`;
  const token = getAccessToken();

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    let message = `Upload failed: ${res.status}`;
    try {
      const body = await res.json();
      message = body.message || body.error || message;
    } catch {}
    throw new Error(message);
  }

  return res.json();
}

export { GATEWAY_URL, getAccessToken, getRefreshToken, setTokens, clearTokens, apiFetch, apiUpload };
