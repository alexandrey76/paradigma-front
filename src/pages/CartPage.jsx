// src/pages/CartPage.jsx
import { useState, useEffect } from "react";
import styled from "styled-components";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

const API_BASE =
  process.env.REACT_APP_API_BASE ||
  "https://alexandrey76-paradigma-back-c956.twc1.net";

export default function CartPage() {
  const { cart, total, clearCart, removeItem, setQty } = useCart();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ✅ важно для Telegram Mini Apps — сообщаем, что веб-приложение готово
  useEffect(() => {
    const tg = window?.Telegram?.WebApp;
    tg?.ready();
    // (опционально) разворачивать на весь экран:
    // tg?.expand?.();
  }, []);

  const handleSubmit = async () => {
    setError("");
    if (!cart?.length) {
      setError("Корзина пуста");
      return;
    }

    const tg = window.Telegram?.WebApp;
    const u = tg?.initDataUnsafe?.user;
    const initData = tg?.initData || "";

    const payload = {
      items: cart.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        qty: i.qty,
      })),
      contact: {
        tg_user_id: u?.id ?? null,
        tg_username: u?.username ?? null,
        tg_first_name: u?.first_name ?? null,
        init_data: initData,
      },
    };

    try {
      setSending(true);
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
          (data && (data.detail || data.message)) || `HTTP ${res.status}`
        );
      }

      alert(`Заявка №${data.order_id} отправлена`);
      clearCart();
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
      <TopBar>
        <BackArrow onClick={() => navigate(-1)}>
          <img
            src={`${process.env.PUBLIC_URL}/assets/images/backArrow.svg`}
            alt="Назад"
          />
        </BackArrow>
        <TitleTop>Корзина</TitleTop>
      </TopBar>

      {!cart?.length ? (
        <EmptyWrap>Корзина пуста</EmptyWrap>
      ) : (
        <>
          {cart.map((i) => (
            <Item key={i.id}>
              {/* Левая колонка: изображение + кнопки под ним */}
              <LeftCol>
                <ImgWrap>
                  {i.images?.[0] ? (
                    <img src={i.images[0]} alt={i.name} />
                  ) : (
                    <NoPic />
                  )}
                </ImgWrap>

                <Controls>
                  <DeleteBtn onClick={() => removeItem(i.id)} aria-label="Удалить">
                    <img
                      src={`${process.env.PUBLIC_URL}/assets/images/trashBin.svg`}
                      alt=""
                    />
                  </DeleteBtn>

                  <QtyBox>
                    <button
                      type="button"
                      onClick={() => setQty(i.id, Math.max(1, i.qty - 1))}
                      aria-label="Уменьшить"
                    >
                      −
                    </button>
                    <span>{i.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(i.id, i.qty + 1)}
                      aria-label="Увеличить"
                    >
                      +
                    </button>
                  </QtyBox>
                </Controls>
              </LeftCol>

              {/* Правая колонка: инфо */}
              <ItemInfo>
                <Price>{i.price.toLocaleString("ru-RU")} руб</Price>
                <Name>{i.name}</Name>

                {i.description && (
                  <SpecList>
                    {i.description
                      .split(/\r?\n|•|- |—/)
                      .filter(Boolean)
                      .map((f, idx) => (
                        <li key={idx}>{f.trim()}</li>
                      ))}
                  </SpecList>
                )}
              </ItemInfo>
            </Item>
          ))}

          {/* Плашка Итого — теперь в потоке, чуть ниже последнего товара */}
          <BottomBar>
            <Total>
              Итого: <b>{total.toLocaleString("ru-RU")} ₽</b>
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

const NAVBAR_HEIGHT = 64; // если твой NavBar другой высоты — поправь тут

const Page = styled.main`
  min-height: 100dvh;
  background: #000;
  color: #fff;
  padding: 12px var(--side-pad) 24px; /* снизу стало меньше, т.к. плашка теперь в потоке */
  font-family: "Montserrat", system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  overflow-x: hidden;
`;

const TopBar = styled.header`
  background: #fff;
  color: #000;
  border-radius: 10px;
  height: 44px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  margin-bottom: 16px;
`;

const BackArrow = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;

  img {
    width: 14px;
    height: 14px;
  }
`;

const TitleTop = styled.h1`
  font-size: 16px;
  font-weight: 700;
  margin: 0;
`;

const EmptyWrap = styled.div`
  min-height: 60vh;
  display: grid;
  place-items: center;
  color: #fff;
`;

const Item = styled.div`
  display: grid;
  grid-template-columns: clamp(150px, 40vw, 220px) 1fr;
  column-gap: 14px;
  margin-bottom: 24px;
`;

const LeftCol = styled.div`
  display: flex;
  flex-direction: column;
`;

const ImgWrap = styled.div`
  border: 3px solid #f5b300;
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
  background: #111;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;   /* ближе к картинке */
  margin-left: 12px; /* отступ от левой стороны */
`;

const DeleteBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: grid;
  place-items: center;

  img {
    width: 26px;
    height: 26px;
  }
`;

const QtyBox = styled.div`
  height: 44px;
  border-radius: 10px;
  border: 2px solid #fff; /* белая рамка */
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: min-content 1fr min-content;
  align-items: center;
  padding: 0 8px;
  gap: 10px;

  button {
    background: none;
    border: none;
    color: #fff;
    font-size: 20px;
    cursor: pointer;
  }

  span {
    font-size: 16px;
    font-weight: 700;
    min-width: 1.6em;
    text-align: center;
  }
`;

const ItemInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Price = styled.div`
  font-weight: 900;
  font-size: 16px;
`;

const Name = styled.div`
  font-size: 14px;
  font-weight: 600;
`;

const SpecList = styled.ul`
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 4px;

  li {
    color: #d6d6d6;
    font-size: 14px;
  }
`;

/* Плашка Итого — в потоке, с отступом сверху и запасом под NavBar */
const BottomBar = styled.div`
  margin-top: 12px;
  margin-bottom: ${NAVBAR_HEIGHT + 12}px; /* чтобы не залезало на навбар */
  padding: 12px var(--side-pad);
  border-top: 2px solid #f5b300;
  background: #000;

  display: flex;
  flex-direction: column;   /* 👈 теперь вертикально */
  align-items: flex-end;    /* кнопка будет справа */
  gap: 10px;                /* отступ между "Итого" и кнопкой */
`;

const Total = styled.div`
  align-self: flex-start;   /* "Итого" слева */
  font-size: 16px;
`;

const SendBtn = styled.button`
  height: 44px;
  padding: 0 16px;
  border-radius: 10px;
  border: 2px solid #f5b300;
  background: #f5b300;
  color: #000;
  font-weight: 700;
  cursor: pointer;
  margin-top: -25px;   /* 👉 сдвинет кнопку вниз */

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

const ErrorMsg = styled.div`
  color: crimson;
  margin-top: 12px;
  font-size: 14px;
`;
