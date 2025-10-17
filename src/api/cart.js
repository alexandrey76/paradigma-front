// src/api/cart.js
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  "https://alexandrey76-paradigma-back-c956.twc1.net"; // ваш бэкенд

// Аккуратно достаём данные TG WebApp
export function getTgContext() {
  const tg = window?.Telegram?.WebApp;
  const u = tg?.initDataUnsafe?.user;
  return {
    tg_user_id: u?.id ?? null,
    tg_username: u?.username ?? null,
    tg_first_name: u?.first_name ?? null,
    init_data: tg?.initData || "",
  };
}

async function http(method, path, body) {
  const { init_data } = getTgContext();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(init_data ? { "X-Telegram-Init-Data": init_data } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(data?.detail || data?.message || `HTTP ${res.status}`);
  }
  return data;
}

// Получить корзину пользователя
export async function fetchServerCart(tg_user_id) {
  if (!tg_user_id) return { items: [] };
  return await http("GET", `/api/cart?tg_user_id=${encodeURIComponent(tg_user_id)}`);
}

// Добавить / создать позицию (qty добавляется относительно текущего)
export async function addServerCartItem({ tg_user_id, product_key, name, price, qty = 1, meta }) {
  if (!tg_user_id) return null;
  return await http("POST", "/api/cart/items", {
    tg_user_id,
    product_key: String(product_key),
    name,
    price,
    qty,
    meta,
  });
}

// Обновить количество (установить абсолютное qty)
export async function updateServerCartQty({ tg_user_id, product_key, qty }) {
  if (!tg_user_id) return null;
  return await http("PATCH", "/api/cart/items", {
    tg_user_id,
    product_key: String(product_key),
    qty,
  });
}

// Удалить позицию
export async function deleteServerCartItem({ tg_user_id, product_key }) {
  if (!tg_user_id) return null;
  return await http(
    "DELETE",
    `/api/cart/items?tg_user_id=${encodeURIComponent(tg_user_id)}&product_key=${encodeURIComponent(
      String(product_key)
    )}`
  );
}
