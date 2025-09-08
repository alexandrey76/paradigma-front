// src/pages/CartPage.jsx
import React, { useState } from "react";
import { useCart } from "../context/CartContext";

// Базовый адрес бэка: возьмём из .env, иначе — локально
const API_BASE = process.env.REACT_APP_API_BASE || "alexandrey76-paradigma-back-c956.twc1.net";

// Берём initData для подписи Telegram Mini App
function getTelegramInitData() {
  try {
    return window?.Telegram?.WebApp?.initData || "";
  } catch {
    return "";
  }
}

export default function CartPage() {
  // предполагаем, что контекст даёт: cart, total, clearCart, removeItem, setQty
  const { cart, total, clearCart, removeItem, setQty } = useCart();

  const [phone, setPhone] = useState("+79991234567");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // простая валидация телефона (+ и цифры, 7–15 символов)
  const validPhone = /^\+?\d{7,15}$/.test(phone.replace(/\s/g, ""));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!cart || cart.length === 0) {
      setError("Корзина пуста");
      return;
    }
    if (!validPhone) {
      setError("Введите телефон (только цифры и +)");
      return;
    }

    // Готовим полезную нагрузку
    const payload = {
      items: cart.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        qty: i.qty,
      })),
      contact: {
        phone,
        comment,
        // Важно: tg_* поля БЭК ПЕРЕЗАПИШЕТ после проверки подписи Telegram
        tg_user_id: u?.id ?? null,
        tg_username: u?.username ?? null,
        tg_first_name: u?.first_name ?? null,
      },
    };

    const initData = getTelegramInitData();

    try {
      setSending(true);

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 🔑 обязательно передаём initData, чтобы бэк мог верифицировать подпись
          "X-Telegram-Init-Data": initData,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        /* сервер мог вернуть не JSON */
      }

      if (!res.ok) {
        const msg =
          (data && (data.detail || data.message)) ||
          `HTTP ${res.status} ${res.statusText}`;
        throw new Error(msg);
      }

      // Успешно: сервер вернёт { order_id, message }
      alert(`Заявка №${data?.order_id || "?"} отправлена`);
      clearCart();
      setComment("");
      setPhone("+79991234567");
    } catch (err) {
      console.error("[Cart submit error]", err);
      setError(String(err.message || err));
      alert(`Ошибка отправки: ${err.message || err}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "24px auto", padding: "0 16px" }}>
      <h1>Корзина</h1>

      {!cart || cart.length === 0 ? (
        <p>Корзина пуста</p>
      ) : (
        <>
          <div style={{ border: "1px solid #e5e5e5", borderRadius: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa" }}>
                  <th style={th}>Товар</th>
                  <th style={th}>Цена</th>
                  <th style={th}>Кол-во</th>
                  <th style={th}>Сумма</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => {
                  const sum = item.price * item.qty;
                  return (
                    <tr key={item.id}>
                      <td style={td}>{item.name}</td>
                      <td style={td}>{item.price} ₽</td>
                      <td style={td}>
                        {typeof setQty === "function" ? (
                          <div style={{ display: "inline-flex", gap: 6 }}>
                            <button
                              type="button"
                              onClick={() =>
                                setQty(item.id, Math.max(1, item.qty - 1))
                              }
                            >
                              −
                            </button>
                            <span>{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => setQty(item.id, item.qty + 1)}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          item.qty
                        )}
                      </td>
                      <td style={td}>{sum} ₽</td>
                      <td style={td}>
                        {typeof removeItem === "function" && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                          >
                            Удалить
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ textAlign: "right", marginTop: 12, fontSize: 18 }}>
            Итого: <b>{total} ₽</b>
          </div>

          <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 10 }}>
              <label>
                Телефон&nbsp;
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/[^\d+]/g, ""))
                  }
                  placeholder="+79991234567"
                  style={{ width: 260 }}
                />
              </label>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label>
                Комментарий
                <br />
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Например, доставка завтра"
                  style={{ width: "100%", maxWidth: 560 }}
                />
              </label>
            </div>

            {error && (
              <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>
            )}

            <button type="submit" disabled={sending || !validPhone}>
              {sending ? "Отправляем…" : "Отправить заявку"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

// немного простых стилей для таблицы
const th = {
  textAlign: "left",
  padding: "10px 12px",
  borderBottom: "1px solid #eee",
  fontWeight: 600,
};

const td = {
  padding: "10px 12px",
  borderBottom: "1px solid #f2f2f2",
};
