// src/api/userApi.js
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  "https://alexandrey76-paradigma-back-c956.twc1.net" ||
  "http://localhost:8000";

export async function ensureUserOnServer() {
  const tg = window?.Telegram?.WebApp;
  const initData = tg?.initData || "";
  if (!initData) {
    // в мини-аппе initData обычно есть, но если открыли в браузере —
    // просто ничего не делаем, чтобы не падало.
    return { ok: false, skipped: true };
  }

  const res = await fetch(`${API_BASE}/api/users/ensure`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": initData,
    },
    body: "{}",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}
