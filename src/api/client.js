// src/api/client.js
const BASE =
  process.env.REACT_APP_API_BASE ||
  "http://localhost:8000" || "https://alexandrey76-paradigma-back-c956.twc1.net"; // локальная отладка

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg =
      (data && (data.detail || data.message || data.error)) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

const api = {
  // --- Cart ---
  getCart: (tg_user_id) => request(`/api/cart?tg_user_id=${tg_user_id}`),
  addCartItem: (payload) =>
    request(`/api/cart/items`, { method: "POST", body: JSON.stringify(payload) }),
  setCartItemQty: (payload) =>
    request(`/api/cart/items`, { method: "PATCH", body: JSON.stringify(payload) }),
  removeCartItem: (tg_user_id, product_key) =>
    request(
      `/api/cart/items?tg_user_id=${tg_user_id}&product_key=${encodeURIComponent(
        product_key
      )}`,
      { method: "DELETE" }
    ),
  clearCart: (tg_user_id) =>
    request(`/api/cart?tg_user_id=${tg_user_id}`, { method: "DELETE" }),

  // --- Orders ---
  createOrder: (payload) =>
    request(`/api/orders`, { method: "POST", body: JSON.stringify(payload) }),

  // --- Misc ---
  ping: () => request(`/api/health`),
};

export default api;
