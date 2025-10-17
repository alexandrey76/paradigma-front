// src/api/cartApi.js
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  "https://alexandrey76-paradigma-back-c956.twc1.net";

function getTGUserId() {
  const tg = window?.Telegram?.WebApp;
  return tg?.initDataUnsafe?.user?.id || null;
}
function getInitData() {
  const tg = window?.Telegram?.WebApp;
  return tg?.initData || "";
}

/**
 * Универсальная функция для всех кнопок:
 * - delta: +1 / -1 / 0
 * - setQty: число (если нужно выставить точное qty), иначе не передавать
 */
export async function cartDelta({ product, delta = 0, setQty = null }) {
  const tg_user_id = getTGUserId();
  if (!tg_user_id) {
    // Без TG user id делать персональную корзину нельзя
    return { ok: false, reason: "no tg_user_id" };
  }

  const payload = {
    tg_user_id,
    product: {
      id: product.id,
      name: product.name,
      price: product.price ?? 0,
    },
    delta,
    setQty,
  };

  const res = await fetch(`${API_BASE}/api/cart/delta`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": getInitData() || "",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);

  return data; // { ok: true, items: [...] }
}

export async function fetchCart() {
  const tg_user_id = getTGUserId();
  if (!tg_user_id) return { items: [] };

  const res = await fetch(`${API_BASE}/api/cart?tg_user_id=${tg_user_id}`, {
    headers: { "X-Telegram-Init-Data": getInitData() || "" },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : { items: [] };
  return data;
}
