// src/api/client.js
const BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000" || "alexandrey76-paradigma-back-c956.twc1.net";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(
      (data && (data.detail || data.message)) || `HTTP ${res.status}`
    );
  }
  return data;
}

export const api = {
  createOrder: (payload) =>
    request("/api/orders", { method: "POST", body: JSON.stringify(payload) }),
  ping: () => request("/api/test-webapp"),
};

export default api;
