// src/pages/CheckoutPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { useCart } from "../context/CartContext";
import makePointerPress from "../utils/makePointerPress";

const API_BASE =
  process.env.REACT_APP_API_BASE ||
  "https://alexandrey76-paradigma-back-c956.twc1.net";

const LOCAL_KEY = "checkout_profile.v1";

// город отправителя для виджета СДЭК (можно задать в .env фронта)
const CDEK_CITY_FROM = process.env.REACT_APP_CDEK_CITY_FROM || "Москва";

const DELIVERY_TYPES = {
  PICKUP: "pickup",
  CDEK_PVZ: "cdek_pvz",
  CDEK_DOOR: "cdek_door",
};

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, total, clearCart } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [tgHandle, setTgHandle] = useState("");
  const [comment, setComment] = useState("");

  const [deliveryType, setDeliveryType] = useState(DELIVERY_TYPES.PICKUP);

  // ---- Доставка/ПВЗ (выбираем через виджет) ----
  const [address, setAddress] = useState(""); // для courier (можно заполнить вручную или из виджета)
  const [selectedPvzCode, setSelectedPvzCode] = useState("");
  const [selectedPvz, setSelectedPvz] = useState(null);

  // ---- расчет (берём из виджета, а не из бекенд-калькулятора) ----
  const [deliveryPrice, setDeliveryPrice] = useState(null);
  const [deliveryDays, setDeliveryDays] = useState(null);
  const [deliveryCalcError, setDeliveryCalcError] = useState("");

  const [saveProfile, setSaveProfile] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [pressedId, setPressedId] = useState(null);

  const PUB = process.env.PUBLIC_URL || "";

  // ---- CDEK widget refs ----
  const widgetRef = useRef(null);
  const widgetReadyRef = useRef(false);

  // ================= helpers =================

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

  const formattedTotal = useMemo(
    () => (Number.isFinite(total) ? total.toLocaleString("ru-RU") : "0"),
    [total]
  );

  // примерно считаем вес: каждая штука 500г, минимум 500г
  const totalWeightGrams = useMemo(() => {
    if (!cart || !cart.length) return 0;
    let qtySum = 0;
    for (const item of cart) qtySum += Number(item.qty || 0);
    return Math.max(500, qtySum * 500);
  }, [cart]);

  const phoneOk = useMemo(() => {
    const digits = phone.replace(/\D/g, "");
    return digits.length === 11;
  }, [phone]);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!phoneOk) return false;
    if (!cart || cart.length === 0) return false;

    if (deliveryType === DELIVERY_TYPES.CDEK_DOOR) {
      // для курьера нужен адрес (может быть заполнен вручную или из виджета)
      if (!address.trim()) return false;
    }

    if (deliveryType === DELIVERY_TYPES.CDEK_PVZ) {
      // для ПВЗ нужен выбранный ПВЗ
      if (!selectedPvzCode) return false;
    }

    return true;
  }, [name, phoneOk, cart, deliveryType, address, selectedPvzCode]);

  // формат телефона в +7 (xxx) xxx-xx-xx
  function formatPhoneFromDigits(raw) {
    let digits = raw.replace(/\D/g, "");
    if (!digits.startsWith("7")) {
      if (digits.startsWith("8")) digits = "7" + digits.slice(1);
      else digits = "7" + digits;
    }
    const d = digits;
    let out = "+7";
    if (d.length >= 2) out += " (" + d.slice(1, 4);
    if (d.length >= 5) out += ") " + d.slice(4, 7);
    else if (d.length > 4) out += ") " + d.slice(4);
    if (d.length >= 8) out += "-" + d.slice(7, 9);
    if (d.length >= 10) out += "-" + d.slice(9, 11);
    return out;
  }

  function handlePhoneChange(e) {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "");
    setPhone(formatPhoneFromDigits(digits));
  }

  // ================= init profile =================

  useEffect(() => {
    const tg = window?.Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;

    // 1) localStorage
    try {
      const savedRaw = localStorage.getItem(LOCAL_KEY);
      if (savedRaw) {
        const saved = JSON.parse(savedRaw);
        if (saved.name) setName(saved.name);
        if (saved.phone) setPhone(saved.phone);
        if (saved.tgHandle) setTgHandle(saved.tgHandle);
        if (saved.deliveryType) setDeliveryType(saved.deliveryType);

        // опционально — восстановим выбранную доставку
        if (saved.deliveryType === DELIVERY_TYPES.CDEK_PVZ) {
          if (saved.selectedPvzCode) setSelectedPvzCode(saved.selectedPvzCode);
          if (saved.selectedPvz) setSelectedPvz(saved.selectedPvz);
        }
        if (saved.deliveryType === DELIVERY_TYPES.CDEK_DOOR) {
          if (saved.address) setAddress(saved.address);
        }
        if (saved.deliveryPrice != null) setDeliveryPrice(saved.deliveryPrice);
        if (saved.deliveryDays) setDeliveryDays(saved.deliveryDays);
      }
    } catch {
      /* ignore */
    }

    // 2) имя/username из Telegram
    if (user && !name) {
      const fullName = `${user.first_name || ""}${
        user.last_name ? " " + user.last_name : ""
      }`.trim();
      if (fullName) setName(fullName);
    }
    if (user && !tgHandle) {
      if (user.username) setTgHandle("@" + user.username);
    }

    // 3) профиль с бэка
    (async () => {
      try {
        const initData = tg?.initData || "";
        const resp = await fetch(`${API_BASE}/api/profile`, {
          headers: { "X-Telegram-Init-Data": initData },
        });
        if (!resp.ok) return;
        const data = await resp.json();
        const profile = data?.profile || {};

        const rawPhone = String(profile.user_phone || "").trim();
        const digits = rawPhone.replace(/\D/g, "");
        if (digits.length === 11) setPhone(formatPhoneFromDigits(digits));

        if (profile.tg_first_name && !name) setName(profile.tg_first_name);
        if (profile.tg_username && !tgHandle) setTgHandle("@" + profile.tg_username);
      } catch {
        /* ignore */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ================= CDEK WIDGET =================
  // Подключаем скрипт виджета и создаём экземпляр. Выбор ПВЗ/курьера — через callback-и.

  useEffect(() => {
    // уже подключали
    if (document.getElementById("ISDEKscript")) return;

    const script = document.createElement("script");
    script.id = "ISDEKscript";
    script.async = true;
    script.src = "https://widget.cdek.ru/widget/widjet.js";

    script.onload = () => {
      // eslint-disable-next-line no-undef
      if (!window.ISDEKWidjet) return;

      const onChoose = (wat) => {
        // wat.PVZ / wat.price / wat.term часто встречаются в интеграциях виджета
        try {
          setDeliveryCalcError("");

          const pvz = wat?.PVZ || wat?.pvz || {};
          const code = pvz?.Code || pvz?.code || pvz?.codePvz || pvz?.PVZCode || "";
          const name = pvz?.Name || pvz?.name || code || "ПВЗ";
          const addressFull =
            pvz?.Address || pvz?.address || pvz?.AddressFull || pvz?.address_full || "";

          setSelectedPvzCode(code || "");
          setSelectedPvz({
            code: code || "",
            name,
            address: addressFull,
            raw: pvz,
          });

          // цена/срок
          const price = safeNum(wat?.price ?? wat?.Price ?? wat?.deliveryPrice);
          const term = safeNum(wat?.term ?? wat?.Term ?? wat?.deliveryTerm);

          if (price != null) setDeliveryPrice(price);
          if (term != null) setDeliveryDays(`${term} дн.`);
        } finally {
          try {
            widgetRef.current?.close?.();
          } catch {
            /* ignore */
          }
        }
      };

      const onChooseProfile = (wat) => {
        // курьерская доставка (до двери)
        try {
          setDeliveryCalcError("");

          const price = safeNum(wat?.price ?? wat?.Price ?? wat?.deliveryPrice);
          const term = safeNum(wat?.term ?? wat?.Term ?? wat?.deliveryTerm);

          if (price != null) setDeliveryPrice(price);
          if (term != null) setDeliveryDays(`${term} дн.`);

          // адреса в виджете могут приходить по-разному; если пришло — заполним
          const addr =
            wat?.address ||
            wat?.Address ||
            wat?.to_address ||
            wat?.toAddress ||
            "";

          if (addr && !String(address || "").trim()) setAddress(String(addr));

          // если пользователь выбрал курьера — переключим тип доставки
          setDeliveryType(DELIVERY_TYPES.CDEK_DOOR);
        } finally {
          try {
            widgetRef.current?.close?.();
          } catch {
            /* ignore */
          }
        }
      };

      try {
        // eslint-disable-next-line no-undef
        widgetRef.current = new window.ISDEKWidjet({
          // базовые
          defaultCity: "Москва",
          cityFrom: CDEK_CITY_FROM,
          country: "Россия",
          link: false,
          popup: true,

          // полезно: поднимать поверх TG WebApp
          // (виджет сам добавляет свои классы, но на некоторых страницах з-индекс мешает)
          // zIndex: 9999, // если поддерживается

          onChoose,
          onChooseProfile,
        });

        widgetReadyRef.current = true;
      } catch (e) {
        console.error("CDEK widget init failed", e);
        widgetReadyRef.current = false;
      }
    };

    script.onerror = () => {
      widgetReadyRef.current = false;
    };

    document.body.appendChild(script);
  }, []);

  const openCdekWidget = () => {
    setDeliveryCalcError("");
    if (!widgetReadyRef.current || !widgetRef.current?.open) {
      showError("Виджет СДЭК не загрузился. Попробуйте обновить страницу.");
      return;
    }
    try {
      widgetRef.current.open();
    } catch (e) {
      console.error("widget open failed", e);
      showError("Не удалось открыть виджет СДЭК");
    }
  };

  // при смене типа доставки: сбрасываем выбор/расчет
  useEffect(() => {
    setError("");
    setDeliveryCalcError("");

    if (deliveryType === DELIVERY_TYPES.PICKUP) {
      setDeliveryPrice(null);
      setDeliveryDays(null);
      setSelectedPvzCode("");
      setSelectedPvz(null);
      // адрес оставим как есть (может пригодиться), но можно чистить:
      // setAddress("");
      return;
    }

    if (deliveryType === DELIVERY_TYPES.CDEK_PVZ) {
      // если переход из курьера — адрес не обязателен, но пусть остаётся
      // сбросим "курьерский" адресный расчет — его снова получим через виджет
      // (если пользователь выберет ПВЗ, адрес не нужен)
      return;
    }

    if (deliveryType === DELIVERY_TYPES.CDEK_DOOR) {
      // сбросим ПВЗ
      setSelectedPvzCode("");
      setSelectedPvz(null);
      return;
    }
  }, [deliveryType]);

  // ================= отправка заказа =================

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!canSubmit) return;

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

    if (!cart.length) {
      const msg = "Корзина пуста";
      setError(msg);
      showError(msg);
      return;
    }

    try {
      setSending(true);

      // 1) сохранить профиль, если стоит галка
      if (saveProfile) {
        // локально
        try {
          localStorage.setItem(
            LOCAL_KEY,
            JSON.stringify({
              name,
              phone,
              tgHandle,
              deliveryType,

              // доп. поля, чтобы было приятно пользователю
              address,
              selectedPvzCode,
              selectedPvz,
              deliveryPrice,
              deliveryDays,
            })
          );
        } catch {
          /* ignore */
        }

        // на бэк
        try {
          await fetch(`${API_BASE}/api/profile`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Telegram-Init-Data": initData || "",
            },
            body: JSON.stringify({
              phone,
              name_for_orders: name,
              tg_for_orders: tgHandle,
            }),
          });
        } catch (e) {
          console.warn("profile save failed", e);
        }
      }

      const items = cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        qty: Number(item.qty),
      }));

      let deliveryPayload = { type: deliveryType };

      if (deliveryType === DELIVERY_TYPES.PICKUP) {
        deliveryPayload = {
          type: DELIVERY_TYPES.PICKUP,
          title: "Самовывоз (г. Москва)",
        };
      } else if (deliveryType === DELIVERY_TYPES.CDEK_DOOR) {
        deliveryPayload = {
          type: DELIVERY_TYPES.CDEK_DOOR,
          address: address.trim(),
          calc_price: deliveryPrice,
          calc_days: deliveryDays,
          weight_grams: totalWeightGrams || null,
        };
      } else if (deliveryType === DELIVERY_TYPES.CDEK_PVZ) {
        deliveryPayload = {
          type: DELIVERY_TYPES.CDEK_PVZ,
          pvz_code: selectedPvzCode,
          pvz: selectedPvz || null,
          calc_price: deliveryPrice,
          calc_days: deliveryDays,
          weight_grams: totalWeightGrams || null,
        };
      }

      const payload = {
        items,
        comment: comment.trim() || null,
        contact: {
          tg_user_id: uid,
          tg_username: u?.username ?? null,
          tg_first_name: u?.first_name ?? null,
          init_data: initData,
          name: name.trim(),
          phone,
          tg_handle: tgHandle.trim() || null,
          delivery: deliveryPayload,
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
      showSuccess(
        `Заказ №${data.order_id} отправлен!\nМенеджер свяжется с вами в ближайшее время.`
      );
      navigate("/");
    } catch (err) {
      console.error("Order submit error:", err);
      const msg = String(err.message || err);
      setError(msg);
      showError(`Ошибка отправки: ${msg}`);
    } finally {
      setSending(false);
    }
  };

  // ================= render =================

  if (!cart || cart.length === 0) {
    return (
      <Page>
        <TopBar title="Оформление заказа" />
        <Empty>Корзина пуста</Empty>
      </Page>
    );
  }

  const deliverySummaryText =
    deliveryType === DELIVERY_TYPES.PICKUP
      ? null
      : deliveryPrice != null
      ? `${Number(deliveryPrice).toLocaleString("ru-RU")} ₽${
          deliveryDays ? ` • ${deliveryDays}` : ""
        }`
      : "будет рассчитана при выборе на карте";

  return (
    <Page>
      <TopBar title="Оформление заказа" />

      <FormCard as="form" onSubmit={handleSubmit}>
        <Header>
          <IconImg src={`${PUB}/assets/images/checkoutLogo.svg`} alt="" />
          <Title>Ваши данные для заказа</Title>
        </Header>

        <Field>
          <Input
            placeholder="Введите ваше имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>

        <Field>
          <Input
            placeholder="+7 (___) ___-__-__"
            value={phone}
            onChange={handlePhoneChange}
            inputMode="tel"
            required
          />
          {!phoneOk && phone.length > 2 && (
            <Hint>Введите телефон в формате +7 (999) 123-45-67</Hint>
          )}
        </Field>

        <Field>
          <Input
            placeholder="tg @"
            value={tgHandle}
            onChange={(e) => setTgHandle(e.target.value)}
          />
        </Field>

        <Field>
          <TextArea
            placeholder="Комментарий к заказу"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel>Варианты доставки:</FieldLabel>

          <DeliveryRadioRow>
            <DeliveryLabel>
              <input
                type="radio"
                name="delivery"
                value={DELIVERY_TYPES.PICKUP}
                checked={deliveryType === DELIVERY_TYPES.PICKUP}
                onChange={() => setDeliveryType(DELIVERY_TYPES.PICKUP)}
              />
              <FakeRadio />
              <span>Самовывоз (г. Москва)</span>
            </DeliveryLabel>

            <DeliveryLabel>
              <input
                type="radio"
                name="delivery"
                value={DELIVERY_TYPES.CDEK_PVZ}
                checked={deliveryType === DELIVERY_TYPES.CDEK_PVZ}
                onChange={() => setDeliveryType(DELIVERY_TYPES.CDEK_PVZ)}
              />
              <FakeRadio />
              <span>СДЭК (до ПВЗ)</span>
            </DeliveryLabel>

            <DeliveryLabel>
              <input
                type="radio"
                name="delivery"
                value={DELIVERY_TYPES.CDEK_DOOR}
                checked={deliveryType === DELIVERY_TYPES.CDEK_DOOR}
                onChange={() => setDeliveryType(DELIVERY_TYPES.CDEK_DOOR)}
              />
              <FakeRadio />
              <span>СДЭК (доставка до двери)</span>
            </DeliveryLabel>
          </DeliveryRadioRow>
        </Field>

        {/* СДЭК: выбор на карте */}
        {deliveryType !== DELIVERY_TYPES.PICKUP && (
          <Field>
            <FieldLabel>Выбор на карте СДЭК:</FieldLabel>

            <CdekBtn
              type="button"
              onClick={openCdekWidget}
              {...makePointerPress((isPressed) =>
                setPressedId(isPressed ? "cdek" : null)
              )}
              $pressed={pressedId === "cdek"}
            >
              Открыть карту СДЭК
            </CdekBtn>

            {deliveryType === DELIVERY_TYPES.CDEK_PVZ && (
              <>
                {!selectedPvzCode ? (
                  <Hint>Выберите ПВЗ на карте — появится адрес и расчет доставки</Hint>
                ) : (
                  <SelectedBox>
                    <div>
                      <b>{selectedPvz?.name || selectedPvzCode}</b>
                    </div>
                    <div>{selectedPvz?.address || "—"}</div>
                    <div style={{ marginTop: 6, opacity: 0.9 }}>
                      Код ПВЗ: <b>{selectedPvzCode}</b>
                    </div>
                  </SelectedBox>
                )}
              </>
            )}

            {deliveryType === DELIVERY_TYPES.CDEK_DOOR && (
              <>
                <Hint>
                  Можно выбрать курьерскую доставку в виджете (там же будет расчет).
                  Если виджет адрес не подставил — заполните вручную ниже.
                </Hint>
              </>
            )}

            {deliveryCalcError && <Hint>⚠ {deliveryCalcError}</Hint>}
          </Field>
        )}

        {/* адрес для курьера */}
        {deliveryType === DELIVERY_TYPES.CDEK_DOOR && (
          <Field>
            <FieldLabel>Адрес доставки:</FieldLabel>
            <TextArea
              placeholder="Город, улица, дом, квартира"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </Field>
        )}

        {/* галочка сохранить профиль */}
        <Field>
          <SaveLabel>
            <input
              type="checkbox"
              checked={saveProfile}
              onChange={(e) => setSaveProfile(e.target.checked)}
            />
            <span>Сохранить данные для последующих заказов</span>
          </SaveLabel>
        </Field>

        <SummaryRow>
          <TotalText>
            Итого за товары: <b>{formattedTotal} ₽</b>
          </TotalText>
        </SummaryRow>

        {deliveryType !== DELIVERY_TYPES.PICKUP && (
          <DeliverySummary>
            Доставка СДЭК:&nbsp;<b>{deliverySummaryText}</b>
          </DeliverySummary>
        )}

        {error && <ErrorText>{error}</ErrorText>}

        <SubmitRow>
          <SubmitBtn
            type="submit"
            disabled={!canSubmit || sending}
            {...makePointerPress((isPressed) =>
              setPressedId(isPressed ? "submit" : null)
            )}
            $pressed={pressedId === "submit"}
          >
            {sending ? "Отправляем…" : "Отправить"}
          </SubmitBtn>
        </SubmitRow>
      </FormCard>

      {/* чтобы попап СДЭК точно был поверх */}
      <CdekZIndexFix />
    </Page>
  );
}

/* ============= styles ============= */

const Page = styled.main`
  min-height: 100dvh;
  background: #000;
  color: #fff;
  padding: 12px var(--side-pad, 16px)
    calc(110px + env(safe-area-inset-bottom));
  font-family: "Montserrat", system-ui, -apple-system, Segoe UI, Roboto, Arial,
    sans-serif;
`;

const Empty = styled.div`
  min-height: 60vh;
  display: grid;
  place-items: center;
  color: #d6d6d6;
`;

const FormCard = styled.section`
  margin-top: 8px;
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.08);
  background: #0b0b0b;
  padding: 18px 16px 20px;
`;

const Header = styled.div`
  display: grid;
  justify-items: center;
  gap: 6px;
  margin-bottom: 16px;
`;

const IconImg = styled.img`
  width: 50px;
  border: px solid rgba(0, 0, 0, 1);
  height: auto;
`;

const Title = styled.h1`
  font-size: 18px;
  font-weight: 800;
  margin: 0;
  text-align: center;
`;

const Field = styled.div`
  margin-bottom: 12px;
  display: grid;
  gap: 6px;
`;

const FieldLabel = styled.div`
  font-size: 13px;
  color: #e6e6e6;
`;

const Input = styled.input`
  height: 44px;
  border-radius: 10px;
  border: 2px solid #222;
  background: #2c2c2c;
  color: #fff;
  padding: 0 12px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #f5b300;
  }
`;

const TextArea = styled.textarea`
  min-height: 100px;
  border-radius: 10px;
  border: 2px solid #222;
  background: #2c2c2c;
  color: #fff;
  padding: 10px 12px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #f5b300;
  }
`;

const Hint = styled.div`
  font-size: 12px;
  color: #ffcb66;
`;

const DeliveryRadioRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FakeRadio = styled.span`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1.5px solid #9e9e9e;
  box-sizing: border-box;
  background: transparent;
`;

const DeliveryLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  color: #d0d0d0;

  input {
    display: none;
  }

  ${FakeRadio} {
    border-color: #888;
  }

  input:checked + ${FakeRadio} {
    background: #fff;
    border-color: #fff;
  }

  input:checked + ${FakeRadio} + span {
    color: #fff;
    font-weight: 500;
  }
`;

const SaveLabel = styled.label`
  display: inline-flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;
  font-size: 12px;
  color: #d0d0d0;

  input {
    width: 14px;
    height: 14px;
  }
`;

const SummaryRow = styled.div`
  margin-top: 6px;
  display: flex;
  justify-content: flex-start;
`;

const TotalText = styled.div`
  font-size: 16px;
  b {
    font-weight: 800;
  }
`;

const DeliverySummary = styled.div`
  margin-top: 4px;
  font-size: 14px;
  color: #e6e6e6;
`;

const SelectedBox = styled.div`
  margin-top: 6px;
  border-radius: 10px;
  border: 1px solid #222;
  background: #141414;
  padding: 10px 10px;
  font-size: 12px;
  color: #e6e6e6;

  b {
    color: #fff;
  }
`;

const ErrorText = styled.div`
  margin-top: 8px;
  font-size: 13px;
  color: #ff6b6b;
`;

const SubmitRow = styled.div`
  margin-top: 14px;
  display: flex;
  justify-content: center;
`;

const SubmitBtn = styled.button`
  width: 100%;
  max-width: 260px;
  height: 46px;
  border-radius: 10px;
  border: 2px solid #f5b300;
  background: #f5b300;
  color: #000;
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
  transition: transform 120ms ease-out, box-shadow 120ms ease-out;
  transform: ${(p) => (p.$pressed ? "scale(.965)" : "scale(1)")};

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

const CdekBtn = styled.button`
  width: 100%;
  height: 44px;
  border-radius: 10px;
  border: 2px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  transition: transform 120ms ease-out;
  transform: ${(p) => (p.$pressed ? "scale(.98)" : "scale(1)")};

  &:active {
    transform: scale(0.98);
  }
`;

const CdekZIndexFix = styled.div`
  /* Попап виджета СДЭК иногда может оказаться под другими слоями (особенно в TG WebApp) */
  /* Ставим повыше всё, что похоже на маску/попап виджета */
  .CDEK-widget__popup-mask,
  .CDEK-widget__popup,
  .CDEK-widget,
  .ISDEK-widget,
  .ISDEKwidget,
  .pvzmap {
    z-index: 99999 !important;
  }
`;
