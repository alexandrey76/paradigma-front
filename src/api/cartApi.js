// src/api/cartApi.js
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  "https://alexandrey76-paradigma-back-c956.twc1.net";

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
    product_id: product?.id ?? null,
    name: product?.name ?? null,
    price: product?.price ?? null,
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
  return data; // { items: [...], total }
}

// Алиас для совместимости с существующими импортами
export { fetchCart as fetchServerCart };

// ---- Обёртки для старых импортов из CartContext ----
export async function addServerCartItem(product, qty = 1) {
  return cartDelta({ product, delta: qty });
}
export async function deleteServerCartItem(productId) {
  // setQty=0 — удалить позицию
  return cartDelta({ product: { id: productId }, setQty: 0 });
}
export async function updateServerCartQty(productId, newQty) {
  return cartDelta({ product: { id: productId }, setQty: newQty });
}

/**
 * Утилита для страниц (если захотите дергать сервер прямо из UI).
 * Передайте локальные методы контекста, чтобы синхронизировать UI.
 */
export async function handleCartAction({
  type,           // 'add' | 'dec' | 'set' | 'remove'
  product,        // объект товара
  newQty,         // для 'set'
  addItem,        // fn из CartContext
  removeItem,     // fn из CartContext
  setQty,         // fn из CartContext
}) {
  if (!product?.id) return;

  if (type === "add") {
    await cartDelta({ product, delta: +1 });
    addItem?.(product, 1);
    return;
  }
  if (type === "dec") {
    await cartDelta({ product, delta: -1 });
    setQty?.(product.id, (q) => Math.max(0, (typeof q === "number" ? q : 1) - 1));
    return;
  }
  if (type === "set") {
    const qty = Math.max(0, Number(newQty || 0));
    await cartDelta({ product, setQty: qty });
    setQty?.(product.id, qty);
    return;
  }
  if (type === "remove") {
    await cartDelta({ product, setQty: 0 });
    removeItem?.(product.id);
    return;
  }
}
