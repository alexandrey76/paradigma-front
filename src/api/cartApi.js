// src/api/cartApi.js
const API_BASE =
  process.env.REACT_APP_API_BASE;

// ---- Telegram context (user + initData) ----
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

/** Базовая операция изменения корзины на сервере */
export async function cartDelta({ product, delta, setQty }) {
  const ctx = getTgContext();

  const payload = {
    tg_user_id: ctx.tg_user_id,
    tg_username: ctx.tg_username,
    tg_first_name: ctx.tg_first_name,
    product_id: String(product?.id), // ВАЖНО: преобразуем в строку
    name: product?.name || `Товар ${product?.id}`,
    price: Number(product?.price) || 0,
    image: product?.images?.[0] || null,
  };

  if (typeof delta === "number") payload.delta = delta;
  if (typeof setQty === "number") payload.set_qty = setQty;

  const res = await apiFetch("/api/cart/update", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.message || "cart update failed");
  return data; // { ok: true }
}

/** Получение корзины с сервера */
export async function fetchCart() {
  const ctx = getTgContext();
  const res = await apiFetch(
    `/api/cart/sync?tg_user_id=${encodeURIComponent(ctx.tg_user_id ?? "")}`,
    { method: "GET" }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.message || "cart fetch failed");
  return data; // массив товаров
}

// Алиас для совместимости с существующими импортами
export { fetchCart as fetchServerCart };

// ---- Обёртки для старых импортов из CartContext ----
export async function addServerCartItem(product, qty = 1) {
  return cartDelta({ product, delta: qty });
}

export async function deleteServerCartItem(productId) {
  // ★ FIXED: передаем объект товара с минимальными данными
  return cartDelta({ 
    product: { 
      id: productId,
      name: `Товар ${productId}`,
      price: 0,
      images: []
    }, 
    setQty: 0 
  });
}

export async function updateServerCartQty(productId, newQty) {
  // ★ FIXED: передаем объект товара с минимальными данными
  return cartDelta({ 
    product: { 
      id: productId,
      name: `Товар ${productId}`,
      price: 0,
      images: []
    }, 
    setQty: newQty 
  });
}