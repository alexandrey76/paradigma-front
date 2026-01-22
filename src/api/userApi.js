// src/api/userApi.js
const API_BASE =
  process.env.REACT_APP_API_BASE;

export async function ensureUserOnServer() {
  const tg = window?.Telegram?.WebApp;
  const initData = tg?.initData || "";
  const u = tg?.initDataUnsafe?.user || {};

  const headers = { "Content-Type": "application/json" };
  if (initData) headers["X-Telegram-Init-Data"] = initData;

  const res = await fetch(`${API_BASE}/api/users/ensure`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      user: {
        tg_user_id: u?.id ?? null,
        tg_username: u?.username ?? null,
        tg_first_name: u?.first_name ?? null,
      },
    }),
    // credentials: "include", // не нужно, если CORS простой
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}
