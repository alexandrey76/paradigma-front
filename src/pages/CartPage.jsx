// src/pages/CartPage.jsx
import { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import products from "../data/products";
import makePointerPress from "../utils/makePointerPress";

const API_BASE =
  process.env.REACT_APP_API_BASE ||
  "https://alexandrey76-paradigma-back-c956.twc1.net";

const NAVBAR_HEIGHT = 64;

function stripCodeFences(text = "") {
  return String(text).replace(/^\s*```|```\s*$/g, "").trim();
}

function parseConfig(raw = "") {
  const text = stripCodeFences(raw);
  const lines = text.split(/\r?\n/);
  const out = [];
  for (let line of lines) {
    let s = line.trim();
    if (!s) continue;
    if (/^комплектац(ия|ии):?$/i.test(s)) continue;
    s = s.replace(/^[-•]\s*/u, "");
    out.push(s);
  }
  return out;
}

// кламп для ручного ввода 1–999
const clampInputQty = (n) => {
  if (!Number.isFinite(n)) return 1;
  if (n <= 1) return 1;
  if (n >= 999) return 999;
  return n;
};

export default function CartPage() {
  const { cart, total, clearCart, removeItem, setQty } = useCart();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [draftQty, setDraftQty] = useState({});
  const [delPressedId, setDelPressedId] = useState(null);
  const [pressedId, setPressedId] = useState(null)
  const navigate = useNavigate();
  const PUB = process.env.PUBLIC_URL || "";

  // синхронизация черновиков количества с корзиной
  useEffect(() => {
    const map = {};
    cart.forEach((i) => {
      map[i.id] = String(i.qty ?? 1);
    });
    setDraftQty(map);
  }, [cart]);

  useEffect(() => {
    const tg = window?.Telegram?.WebApp;
    tg?.ready();
  }, []);

  const formattedTotal = useMemo(
    () => (Number.isFinite(total) ? total.toLocaleString("ru-RU") : "0"),
    [total]
  );

  // ===== nice popups =====
  const showSuccess = (msg) => {
    const tg = window?.Telegram?.WebApp;
    if (tg?.showPopup) {
      tg.showPopup({
        title: "Готово!",
        message: msg,
        buttons: [{ type: "close" }],
      });
    } else if (tg?.showAlert) {
      tg.showAlert(msg);
    } else {
      alert(msg);
    }
  };

  const showError = (msg) => {
    const tg = window?.Telegram?.WebApp;
    if (tg?.showPopup) {
      tg.showPopup({
        title: "Ошибка",
        message: msg,
        buttons: [{ type: "close" }],
      });
    } else if (tg?.showAlert) {
      tg.showAlert(msg);
    } else {
      alert(msg);
    }
  };

  const handleSubmit = async () => {
    setError("");

    const tg = window.Telegram?.WebApp;
    const u = tg?.initDataUnsafe?.user;
    const initData = tg?.initData || "";
    const uid = u?.id || null;

    if (!uid) {
      const msg = "Не удалось определить пользователя Telegram";
      setError(msg);
      showError(msg);
      return;
    }

    try {
      setSending(true);

      if (!cart.length) {
        const msg = "Корзина пуста";
        setError(msg);
        showError(msg);
        return;
      }

      const items = cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        qty: Number(item.qty),
      }));

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

      clearCart();

      try {
        await fetch(`${API_BASE}/api/cart`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tg_user_id: uid }),
        });
      } catch (err) {
        console.log("Cart clear failed, but order was created:", err);
      }

      showSuccess(
        `Заказ №${data.order_id} отправлен!\nМенеджер свяжется с вами в ближайшее время.`
      );
    } catch (err) {
      console.error("Request error:", err);
      const msg = String(err.message || err);
      setError(msg);
      showError(`Ошибка отправки: ${msg}`);
    } finally {
      setSending(false);
    }
  };

  // ====== работа с количеством ======

  const handleDec = async (id, current) => {
    try {
      if (current <= 1) {
        await setQty(id, 0); // удаление
      } else {
        await setQty(id, current - 1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleInc = async (id, current) => {
    if (current >= 999) return;
    try {
      await setQty(id, current + 1);
    } catch (e) {
      console.error(e);
    }
  };

  const handleQtyChange = (id, value) => {
    const v = String(value).replace(/[^\d]/g, "");
    if (v === "") {
      setDraftQty((prev) => ({ ...prev, [id]: "" }));
      return;
    }
    let n = parseInt(v, 10);
    if (Number.isNaN(n)) return;
    if (n > 999) n = 999;
    setDraftQty((prev) => ({ ...prev, [id]: String(n) }));
  };

  const commitQty = async (id, current) => {
    const raw = draftQty[id];
    if (raw === "" || raw == null) {
      setDraftQty((prev) => ({
        ...prev,
        [id]: String(current || 1),
      }));
      return;
    }
    let n = parseInt(raw, 10);
    if (Number.isNaN(n)) {
      setDraftQty((prev) => ({
        ...prev,
        [id]: String(current || 1),
      }));
      return;
    }
    n = clampInputQty(n); // 1–999

    if (n !== current) {
      try {
        await setQty(id, n);
      } catch (e) {
        console.error(e);
      }
    }

    setDraftQty((prev) => ({ ...prev, [id]: String(n) }));
  };

  const handleQtyKeyDown = (e, id, current) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setDraftQty((prev) => ({
        ...prev,
        [id]: String(current || 1),
      }));
      e.currentTarget.blur();
    }
  };

  return (
    <Page>
      <TopBar title="Корзина" hideBack />
      {!cart?.length ? (
        <EmptyWrap>Корзина пуста</EmptyWrap>
      ) : (
        <>
          {cart.map((i) => {
            const fromCatalog = products.find(
              (p) => Number(p.id) === Number(i.id)
            );
            const cfgLines = parseConfig(
              i.configuration ?? fromCatalog?.configuration ?? ""
            );
            const qty = i.qty ?? 1;
            const draft = draftQty[i.id] ?? String(qty);
            const plusDisabled = qty >= 999;

            return (
              <Item key={i.id}>
                <LeftCol>
                  <Clickable onClick={() => navigate(`/product/${i.id}`)}>
                    <ImgWrap>
                      {i.images?.[0] ? (
                        <img src={i.images[0]} alt={i.name} />
                      ) : (
                        <NoPic />
                      )}
                    </ImgWrap>
                  </Clickable>

                  <Controls>
                    <DeleteBtn
                      {...makePointerPress(
                        (isPressed) =>
                          setDelPressedId(isPressed ? i.id : null),
                        () => removeItem(i.id)
                      )}
                      $pressed={delPressedId === i.id}
                      aria-label="Удалить"
                    >
                      <img
                        src={`${PUB}/assets/images/trashBin.svg`}
                        alt=""
                      />
                    </DeleteBtn>

                    <QtyBox>
                      <QtyBtn
                        type="button"
                        {...makePointerPress(
                          (isPressed) => setPressedId(isPressed ? `dec-${i.id}` : null),
                          () => handleDec(i.id, qty)
                        )}
                        $pressed={pressedId === `dec-${i.id}`}
                        aria-label="Уменьшить"
                      >
                        −
                      </QtyBtn>

                      <QtyInput
                        type="tel"
                        inputMode="numeric"
                        min={1}
                        max={999}
                        value={draft}
                        onChange={(e) =>
                          handleQtyChange(i.id, e.target.value)
                        }
                        onBlur={() => commitQty(i.id, qty)}
                        onKeyDown={(e) =>
                          handleQtyKeyDown(e, i.id, qty)
                        }
                        aria-label="Количество"
                      />

                      <QtyBtn
                        type="button"
                        {...makePointerPress(
                          (isPressed) => setPressedId(isPressed ? `inc-${i.id}` : null),
                          () => handleInc(i.id, qty)
                        )}
                        $pressed={pressedId === `inc-${i.id}`}
                        aria-label="Увеличть"
                      >
                        +
                      </QtyBtn>
                    </QtyBox>
                  </Controls>
                </LeftCol>

                <ItemInfo onClick={() => navigate(`/product/${i.id}`)}>
                  <Price>{i.price.toLocaleString("ru-RU")} ₽</Price>
                  <Name>{i.name}</Name>

                  {!!cfgLines.length && (
                    <>
                      <ConfigTitle>Комплектация:</ConfigTitle>
                      <ConfigList>
                        {cfgLines.map((line, idx) => (
                          <li key={idx}>{line}</li>
                        ))}
                      </ConfigList>
                    </>
                  )}
                </ItemInfo>
              </Item>
            );
          })}

          <BottomBar>
            <Total>
              Итого: <b>{formattedTotal} ₽</b>
            </Total>
            <SendBtn onClick={handleSubmit} disabled={sending}>
              {sending ? "Отправляем…" : "Сделать заказ"}
            </SendBtn>
          </BottomBar>
        </>
      )}

      {error && <ErrorMsg>{error}</ErrorMsg>}
    </Page>
  );
}

/* ===== styles ===== */

const Page = styled.main`
  min-height: 100dvh;
  background: #000;
  color: #fff;
  padding: 12px var(--side-pad, 16px) 24px;
  font-family: "Montserrat", system-ui, -apple-system, Segoe UI, Roboto,
    sans-serif;
  overflow-x: hidden;
  touch-action: manipulation;
`;

const EmptyWrap = styled.div`
  min-height: 60vh;
  display: grid;
  place-items: center;
`;

const Item = styled.div`
  display: grid;
  grid-template-columns: clamp(150px, 40vw, 220px) 1fr;
  column-gap: 14px;
  margin-bottom: 24px;

  @media (max-width: 420px) {
    grid-template-columns: 1.1fr 1.4fr;
  }
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
  background: #111;
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
  transition: transform 120ms ease-out, box-shadow 120ms ease-out;
  transform: ${(p) => (p.$pressed ? "scale(.965)" : "scale(1)")};

  img {
    width: clamp(26px, 6.2vw, 34px);
    height: clamp(26px, 6.2vw, 34px);
  }

  padding: 4px;
`;

const QtyBox = styled.div`
  height: clamp(34px, 8vw, 40px);
  border-radius: 10px;
  border: 2px solid #fff;
  display: grid;
  grid-template-columns: clamp(28px, 7vw, 34px) minmax(52px, 80px)
    clamp(28px, 7vw, 34px);
  align-items: stretch;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
`;

const QtyBtn = styled.button`
  background: none;
  border: none;
  color: ${(p) => (p.$disabled ? "#777" : "#fff")};
  font-size: clamp(16px, 4vw, 20px);
  cursor: ${(p) => (p.$disabled ? "default" : "pointer")};
  transition: transform 120ms ease-out, box-shadow 120ms ease-out;
  transform: ${(p) => (p.$pressed ? "scale(.965)" : "scale(1)")};
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  opacity: ${(p) => (p.$disabled ? 0.4 : 1)};
`;

const QtyInput = styled.input`
  width: 100%;
  min-width: 0;
  height: 100%;
  background: transparent;
  border: none;
  color: #fff;
  font-size: clamp(14px, 3.5vw, 18px);
  font-weight: 700;
  text-align: center;
  box-sizing: border-box;
  outline: none;
  padding: 0 4px;
  -webkit-tap-highlight-color: transparent;

  appearance: textfield;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    margin: 0;
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
`;

const Name = styled.div`
  font-size: clamp(14px, 3.6vw, 16px);
  font-weight: 600;
`;

const ConfigTitle = styled.div`
  margin-top: 6px;
  font-weight: 700;
  font-size: clamp(14px, 3.6vw, 16px);
`;

const ConfigList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 4px 0 0;

  li {
    position: relative;
    padding-left: 18px;
    color: #d6d6d6;
    font-size: clamp(13px, 3.4vw, 15px);
    line-height: 1.35;
  }

  li::before {
    content: "";
    position: absolute;
    left: 6px;
    top: 0.6em;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #d6d6d6;
    transform: translateY(-50%);
  }
`;

const BottomBar = styled.div`
  margin-top: 12px;
  margin-bottom: ${NAVBAR_HEIGHT + 12}px;
  padding: 12px var(--side-pad, 16px);
  border-top: 2px solid #f5b300;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
`;

const Total = styled.div`
  align-self: flex-start;
  font-size: clamp(16px, 4vw, 18px);
`;

const SendBtn = styled.button`
  height: 44px;
  padding: 0 16px;
  border-radius: 10px;
  border: 2px solid #f5b300;
  background: #f5b300;
  color: #000;
  font-weight: 700;
  font-size: clamp(14px, 3.8vw, 16px);
  cursor: pointer;

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
