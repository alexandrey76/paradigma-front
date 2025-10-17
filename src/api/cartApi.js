// src/api/cartApi.js
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  "https://alexandrey76-paradigma-back-c956.twc1.net"; // твой бэк

// Собираем контекст из Telegram WebApp
export function getTgContext() {
  const tg = window?.Telegram?.WebApp;
  const user = tg?.initDataUnsafe?.user || {};
  const initData = tg?.initData || "";

  return {
    init_data: initData,
    tg_user_id: user.id ?? null,
    tg_username: user.username ?? null,
    tg_first_name: user.first_name ?? null,
  };
}

async function apiFetch(path, opts = {}) {
  const ctx = getTgContext();

  const headers = {
    "Content-Type": "application/json",
    "X-Telegram-Init-Data": ctx.init_data || "",
    ...(opts.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  return res;
}

// +1 / -1 / setQty для корзины в БД
export async function cartDelta({ product, delta, setQty }) {
  const ctx = getTgContext();

  const payload = {
    tg_user_id: ctx.tg_user_id,
    tg_username: ctx.tg_username,
    tg_first_name: ctx.tg_first_name,
    product_id: product.id,
    name: product.name,
    price: product.price,
    image: product.images?.[0] || null,
  };

  if (typeof setQty === "number") payload.set_qty = setQty;
  if (typeof delta === "number") payload.delta = delta;

  const res = await apiFetch("/api/cart/update", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || data.message || "cart update failed");
  }
  return data; // { ok: true, ... }
}

// Получить актуальную корзину из БД (для синхронизации при старте)
export async function fetchCart() {
  const ctx = getTgContext();

  const url = `/api/cart/sync?tg_user_id=${encodeURIComponent(
    ctx.tg_user_id ?? ""
  )}`;

  const res = await apiFetch(url, { method: "GET" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || data.message || "cart fetch failed");
  }
  return data; // { items: [{product_id, qty, ...}], total }
}
