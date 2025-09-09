// src/pages/CartPage.jsx
import { useState } from "react";
import { useCart } from "../context/CartContext";

// если у тебя есть .env — он перекроет это значение
const API_BASE =
  process.env.REACT_APP_API_BASE || "https://alexandrey76-paradigma-back-c956.twc1.net";

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

    // ДЕБАГ: Проверяем доступность Telegram WebApp
    console.log("=== TELEGRAM DEBUG ===");
    console.log("Window.Telegram:", window.Telegram);
    console.log("Window.Telegram.WebApp:", window.Telegram?.WebApp);
    
    const tg = window.Telegram?.WebApp;
    const u = tg?.initDataUnsafe?.user;
    const initData = tg?.initData || "";
    
    console.log("User object:", u);
    console.log("InitData:", initData);
    console.log("InitData length:", initData.length);

    if (!cart?.length) {
      setError("Корзина пуста");
      return;
    }
    if (!validPhone) {
      setError("Введите телефон (только цифры и +)");
      return;
    }

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
        tg_username: u?.username ?? null,
        tg_first_name: u?.first_name ?? null,
        init_data: initData,
        // Дополнительная отладочная информация
        _debug: {
          has_telegram: !!window.Telegram,
          has_webapp: !!window.Telegram?.WebApp,
          has_user: !!u,
          user_data: u ? {
            id: u.id,
            username: u.username,
            first_name: u.first_name
          } : null
        }
      },
    };

    // Важный лог для диагностики
    console.log("Payload to send:", JSON.stringify(payload, null, 2));

    try {
      setSending(true);
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": initData || ""
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", res.status);
      const text = await res.text();
      console.log("Response text:", text);
      
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        throw new Error(
          (data && (data.detail || data.message)) || `HTTP ${res.status}`
        );
      }

      alert(`Заявка №${data.order_id} отправлена`);
      clearCart();
      setPhone("+79991234567");
      setComment("");
    } catch (err) {
      console.error("Request error:", err);
      setError(String(err.message || err));
      alert(`Ошибка отправки: ${err.message || err}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1>Корзина</h1>

      {!cart?.length ? (
        <div>Корзина пуста</div>
      ) : (
        <>
          <ul>
            {cart.map((i) => (
              <li key={i.id} style={{ marginBottom: 8 }}>
                {i.name} — {i.price} ₽ × {i.qty}{" "}
                <button onClick={() => remove(i.id)}>Удалить</button>
              </li>
            ))}
          </ul>
          <div style={{ margin: "8px 0 16px" }}>
            <b>Итого:</b> {total} ₽
          </div>
        </>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          Телефон{" "}
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
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