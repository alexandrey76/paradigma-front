// src/pages/CartPage.jsx
import { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import api from "../api/client";
import { getTgContext, cartDelta } from "../api/cartApi";

// корректный приоритет: env или локалка
const API_BASE =
  (process.env.REACT_APP_API_BASE && process.env.REACT_APP_API_BASE.trim()) ||
  "http://localhost:8000";

export default function CartPage() {
  const { cart, total, clearCart, removeItem, setQty } = useCart();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const PUB = process.env.PUBLIC_URL || "";

  useEffect(() => {
    const tg = window?.Telegram?.WebApp;
    tg?.ready();
  }, []);

  const formattedTotal = useMemo(
    () => (Number.isFinite(total) ? total.toLocaleString("ru-RU") : "0"),
    [total]
  );

  // Функция для обновления количества с синхронизацией на сервер
  const updateQuantity = async (product, newQty) => {
    try {
      // 1. Обновляем локальное состояние
      setQty(product.id, newQty);
      
      // 2. Синхронизируем с сервером
      await cartDelta({ product, setQty: newQty });
    } catch (err) {
      console.error("Error updating quantity:", err);
      // Можно показать уведомление об ошибке
    }
  };

  // Функция для удаления товара с синхронизацией на сервер
  const removeItemWithSync = async (product) => {
    try {
      // 1. Удаляем локально
      removeItem(product.id);
      
      // 2. Синхронизируем с сервером
      await cartDelta({ product, setQty: 0 });
    } catch (err) {
      console.error("Error removing item:", err);
    }
  };

  const handleSubmit = async () => {
    setError("");

    // 1) Получаем пользователя из Telegram
    const tg = window.Telegram?.WebApp;
    const u = tg?.initDataUnsafe?.user;
    const initData = tg?.initData || "";

    const uid = u?.id || null;
    if (!uid) {
      setError("Не удалось определить пользователя Telegram");
      alert("Не удалось определить пользователя Telegram");
      return;
    }

    try {
      setSending(true);

      // 2) Используем текущую корзину из контекста (уже синхронизирована с сервером)
      if (!cart.length) {
        setError("Корзина пуста");
        alert("Корзина пуста");
        return;
      }

      // 3) Формируем items в правильном формате для бэкенда
      const items = cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        qty: Number(item.qty),
      }));

      // 4) Формируем контакт и отправляем заказ
      const payload = {
        items,
        contact: {
          tg_user_id: uid,
          tg_username: u?.username ?? null,
          tg_first_name: u?.first_name ?? null,
          init_data: initData,
        },
      };

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": initData || "",
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        throw new Error(
          (data && (data.detail || data.message || data.error)) ||
            `HTTP ${res.status}`
        );
      }

      // 5) Очищаем корзину на сервере и в контексте
      // Сначала очищаем локально, затем на сервере
      clearCart();
      
      // Удаляем все товары на сервере
      const deletePromises = cart.map(item =>
        cartDelta({ product: item, setQty: 0 })
      );
      await Promise.allSettled(deletePromises);
      
      alert(`Заявка №${data.order_id} отправлена! Менеджер свяжется с вами в ближайшее время.`);
      
      // 6) Перенаправляем на главную или страницу успеха
      navigate("/");
      
    } catch (err) {
      console.error("Request error:", err);
      setError(String(err.message || err));
      alert(`Ошибка отправки: ${err.message || err}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <Page>
      <TopBar title="Корзина" />
      {!cart?.length ? (
        <EmptyWrap>Корзина пуста</EmptyWrap>
      ) : (
        <>
          {cart.map((item) => (
            <Item key={item.id}>
              <LeftCol>
                <Clickable onClick={() => navigate(`/product/${item.id}`)}>
                  <ImgWrap>
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={item.name} />
                    ) : (
                      <NoPic />
                    )}
                  </ImgWrap>
                </Clickable>

                <Controls>
                  <DeleteBtn 
                    onClick={() => removeItemWithSync(item)} 
                    aria-label="Удалить"
                  >
                    <img src={`${PUB}/assets/images/trashBin.svg`} alt="" />
                  </DeleteBtn>

                  <QtyBox>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item, Math.max(0, item.qty - 1))}
                      aria-label="Уменьшить"
                      disabled={item.qty <= 1}
                    >
                      −
                    </button>
                    <span>{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item, item.qty + 1)}
                      aria-label="Увеличить"
                    >
                      +
                    </button>
                  </QtyBox>
                </Controls>
              </LeftCol>

              <ItemInfo onClick={() => navigate(`/product/${item.id}`)}>
                <Price>{item.price.toLocaleString("ru-RU")} руб</Price>
                <Name>{item.name}</Name>

                {item.description && (
                  <SpecList>
                    {item.description
                      .split(/\r?\n|•|- |—/m)
                      .filter(Boolean)
                      .map((f, idx) => (
                        <li key={idx}>{f.trim()}</li>
                      ))}
                  </SpecList>
                )}
              </ItemInfo>
            </Item>
          ))}

          <BottomBar>
            <Total>
              Итого: <b>{formattedTotal} ₽</b>
            </Total>
            <SendBtn onClick={handleSubmit} disabled={sending}>
              {sending ? "Отправляем…" : "Оставить заявку"}
            </SendBtn>
          </BottomBar>
        </>
      )}

      {error && <ErrorMsg>{error}</ErrorMsg>}
    </Page>
  );
}

/* ===== styled-components ===== */

const NAVBAR_HEIGHT = 64;

const Page = styled.main`
  min-height: 100dvh;
  background: #000;
  color: #fff;
  padding: 12px var(--side-pad, 16px) 24px;
  font-family: "Montserrat", system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  overflow-x: hidden;
  touch-action: manipulation;
`;

const EmptyWrap = styled.div`
  min-height: 60vh;
  display: grid;
  place-items: center;
  font-size: 18px;
  color: #888;
`;

const Item = styled.div`
  display: grid;
  grid-template-columns: clamp(150px, 40vw, 220px) 1fr;
  column-gap: 14px;
  margin-bottom: 24px;
  padding: 12px;
  background: #111;
  border-radius: 12px;
`;

const LeftCol = styled.div`
  display: flex;
  flex-direction: column;
`;

const Clickable = styled.div`
  cursor: pointer;
`;

const ImgWrap = styled.div`
  border: 3px solid #f8f8f8ff;
  border-radius: 10px;
  overflow: hidden;
  aspect-ratio: 1 / 1;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const NoPic = styled.div`
  width: 100%;
  height: 100%;
  background: #222;
  display: grid;
  place-items: center;
  color: #666;
  font-size: 14px;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  margin-left: 4px;
`;

const DeleteBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  padding: 4px;
  border-radius: 6px;
  transition: background-color 0.2s;

  &:hover {
    background: #222;
  }

  img {
    width: clamp(26px, 6.2vw, 34px);
    height: clamp(26px, 6.2vw, 34px);
  }
`;

const QtyBox = styled.div`
  height: clamp(34px, 8vw, 40px);
  border-radius: 10px;
  border: 2px solid #fff;

  display: grid;
  grid-template-columns:
    clamp(28px, 7vw, 34px)
    1fr
    clamp(28px, 7vw, 34px);
  align-items: center;

  column-gap: 6px;
  padding: 0 6px;

  width: 100%;
  max-width: 120px;
  box-sizing: border-box;

  button {
    background: none;
    border: none;
    color: #fff;
    font-size: clamp(16px, 4vw, 20px);
    cursor: pointer;
    display: grid;
    place-items: center;
    
    &:disabled {
      color: #666;
      cursor: not-allowed;
    }
    
    &:not(:disabled):hover {
      background: #222;
      border-radius: 4px;
    }
  }

  span {
    font-size: clamp(14px, 3.5vw, 18px);
    font-weight: 700;
    text-align: center;
    min-width: 1.5em;
  }
`;

const ItemInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
`;

const Price = styled.div`
  font-weight: 900;
  font-size: clamp(16px, 4.2vw, 20px);
  color: #f5b300;
`;

const Name = styled.div`
  font-size: clamp(14px, 3.6vw, 16px);
  font-weight: 600;
`;

const SpecList = styled.ul`
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 4px;

  li {
    color: #d6d6d6;
    font-size: clamp(13px, 3.4vw, 15px);
  }
`;

const BottomBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px var(--side-pad, 16px);
  border-top: 2px solid #f5b300;
  background: #000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
`;

const Total = styled.div`
  font-size: clamp(16px, 4vw, 18px);
  font-weight: 600;
`;

const SendBtn = styled.button`
  height: 44px;
  padding: 0 20px;
  border-radius: 10px;
  border: 2px solid #f5b300;
  background: #f5b300;
  color: #000;
  font-weight: 700;
  font-size: clamp(14px, 3.8vw, 16px);
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #ffc400;
    border-color: #ffc400;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMsg = styled.div`
  color: #ff4444;
  margin-top: 12px;
  font-size: 14px;
  text-align: center;
  padding: 8px;
  background: #1a0000;
  border-radius: 6px;
`;