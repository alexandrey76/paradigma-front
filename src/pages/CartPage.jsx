// src/pages/CartPage.jsx
import { useState } from "react";
import { useCart } from "../context/CartContext";

// базовый URL бэка: возьмём из .env, иначе — ваш прод URL
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  "https://alexandrey76-paradigma-back-c956.twc1.net";

export default function CartPage() {
  const { cart, total, clearCart, remove } = useCart();
  const [phone, setPhone] = useState("+79991234567");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const validPhone = /^\+?\d{7,15}$/.test(phone.replace(/\s/g, ""));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!cart?.length) {
      setError("Корзина пуста");
      return;
    }
    if (!validPhone) {
      setError("Введите телефон (только цифры и +)");
      return;
    }

    // Telegram mini app
    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData || "";                // строка initData (мягко пробрасываем)
    const u = tg?.initDataUnsafe?.user || null;         // объект user, если аппа открыта в Telegram

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
        tg_user_id: u?.id ?? null,
        tg_username: u?.username ?? null,     // без '@'
        tg_first_name: u?.first_name ?? null,
      },
    };

    try {
      setSending(true);

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": initData, // мягкая передача initData
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        /* не JSON */
      }

      if (!res.ok) {
        throw new Error(
          (data && (data.detail || data.message)) || `HTTP ${res.status}`
        );
      }

      alert(`Заявка №${data.order_id} отправлена.`);
      clearCart();
      setPhone("+79991234567");
      setComment("");
    } catch (err) {
      console.error(err);
      setError(String(err.message || err));
      alert(`Ошибка отправки: ${err.message || err}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1>Корзина</h1>

      {(!cart || cart.length === 0) && <div>Корзина пуста</div>}

      {cart?.length > 0 && (
        <>
          <ul>
            {cart.map((i) => (
              <li key={i.id} style={{ marginBottom: 8 }}>
                {i.name} — {i.price} ₽ × {i.qty}{" "}
                <button onClick={() => remove(i.id)} style={{ marginLeft: 8 }}>
                  Удалить
                </button>
              </li>
            ))}
          </ul>
          <div style={{ fontWeight: 700, marginTop: 6 }}>Итого: {total} ₽</div>
        </>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
        <div>
          Телефон&nbsp;
          <input
            type="tel"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value.replace(/[^\d+]/g, ""))
            }
            placeholder="+79991234567"
          />
        </div>
        <div style={{ marginTop: 8 }}>
          Комментарий
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Например, доставка завтра"
            style={{ width: "100%" }}
          />
        </div>

        <button type="submit" style={{ marginTop: 10 }} disabled={sending}>
          {sending ? "Отправляем…" : "Отправить заявку"}
        </button>

        {error && <div style={{ color: "crimson", marginTop: 8 }}>{error}</div>}
      </form>
    </div>
  );
}
