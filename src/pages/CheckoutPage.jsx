// src/pages/CheckoutPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { useCart } from "../context/CartContext";
import makePointerPress from "../utils/makePointerPress";

// ✅ CDEK widget (npm i @cdek-it/widget)
import CDEKWidget from "@cdek-it/widget";

const API_BASE =
  process.env.REACT_APP_API_BASE ||
  "https://alexandrey76-paradigma-back-c956.twc1.net";

const YM_API_KEY = process.env.REACT_APP_YMAPS_API_KEY || "";
const LOCAL_KEY = "checkout_profile.v1";

const DELIVERY_TYPES = {
  PICKUP: "pickup",
  CDEK_PVZ: "cdek_pvz",
  CDEK_DOOR: "cdek_door",
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, total, clearCart } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [tgHandle, setTgHandle] = useState("");
  const [comment, setComment] = useState("");

  const [deliveryType, setDeliveryType] = useState(DELIVERY_TYPES.PICKUP);

  // ====== CDEK: город + ПВЗ ======
  const [cdekCityQuery, setCdekCityQuery] = useState("");
  const [cdekCityLoading, setCdekCityLoading] = useState(false);
  const [cdekCityList, setCdekCityList] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);

  const [pvzMode, setPvzMode] = useState("list"); // "list" | "map"
  const [pvzTerm, setPvzTerm] = useState("");

  const [pvzList, setPvzList] = useState([]);
  const [pvzLoading, setPvzLoading] = useState(false);
  const [selectedPvzCode, setSelectedPvzCode] = useState("");
  const [selectedPvz, setSelectedPvz] = useState(null);

  // калькуляция доставки
  const [deliveryPrice, setDeliveryPrice] = useState(null);
  const [deliveryDays, setDeliveryDays] = useState(null);
  const [deliveryCalcLoading, setDeliveryCalcLoading] = useState(false);
  const [deliveryCalcError, setDeliveryCalcError] = useState("");

  const [saveProfile, setSaveProfile] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [pressedId, setPressedId] = useState(null);

  const PUB = process.env.PUBLIC_URL || "";

  // ====== CDEK widget refs ======
  const widgetRef = useRef(null);

  // IMPORTANT: root id должен совпадать с элементом в DOM
  const widgetRootId = "cdek-map";

  // ====== inject CDEK widget CSS via CDN (фикс сборки / exports) ======
  useEffect(() => {
    const id = "cdek-widget-css";
    if (document.getElementById(id)) return;

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    // можно зафиксировать версию (пример ниже) или оставить latest.
    link.href =
      "https://cdn.jsdelivr.net/npm/@cdek-it/widget@3.11.1/dist/cdek-widget.css";
    document.head.appendChild(link);
  }, []);

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
      return true;
    }

    if (deliveryType === DELIVERY_TYPES.CDEK_PVZ) {
      if (!selectedCity?.code) return false;
      if (!selectedPvzCode) return false;
    }

    return true;
  }, [name, phoneOk, cart, deliveryType, selectedPvzCode, selectedCity]);

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

  // ================= начальное заполнение =================
  useEffect(() => {
    const tg = window?.Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;

    try {
      const savedRaw = localStorage.getItem(LOCAL_KEY);
      if (savedRaw) {
        const saved = JSON.parse(savedRaw);
        if (saved.name) setName(saved.name);
        if (saved.phone) setPhone(saved.phone);
        if (saved.tgHandle) setTgHandle(saved.tgHandle);
        if (saved.deliveryType) setDeliveryType(saved.deliveryType);
      }
    } catch {}

    if (user && !name) {
      const fullName = `${user.first_name || ""}${
        user.last_name ? " " + user.last_name : ""
      }`.trim();
      if (fullName) setName(fullName);
    }
    if (user && !tgHandle) {
      if (user.username) setTgHandle("@" + user.username);
    }

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
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ================= города: автодополнение =================
  useEffect(() => {
    if (deliveryType !== DELIVERY_TYPES.CDEK_PVZ) return;

    const q = cdekCityQuery.trim();
    if (q.length < 2) {
      setCdekCityList([]);
      return;
    }

    let aborted = false;
    setCdekCityLoading(true);

    (async () => {
      try {
        const resp = await fetch(
          `${API_BASE}/api/delivery/cdek/cities?query=${encodeURIComponent(q)}`
        );
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        const data = await resp.json();
        if (!aborted) setCdekCityList(Array.isArray(data.cities) ? data.cities : []);
      } catch (e) {
        if (!aborted) {
          console.error("cities load failed", e);
          setCdekCityList([]);
        }
      } finally {
        if (!aborted) setCdekCityLoading(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [cdekCityQuery, deliveryType]);

  // при смене выбранного города — сбрасываем ПВЗ/доставку
  useEffect(() => {
    setSelectedPvzCode("");
    setSelectedPvz(null);
    setPvzList([]);
    setPvzTerm("");
    setDeliveryPrice(null);
    setDeliveryDays(null);
    setDeliveryCalcError("");
  }, [selectedCity?.code]);

  // ================= список ПВЗ (по городу + term) =================
  useEffect(() => {
    if (deliveryType !== DELIVERY_TYPES.CDEK_PVZ) return;
    if (!selectedCity?.code) return;
    if (pvzMode !== "list") return;

    let aborted = false;
    setPvzLoading(true);

    (async () => {
      try {
        const qs = new URLSearchParams();
        qs.set("city_code", String(selectedCity.code));
        if (pvzTerm.trim()) qs.set("term", pvzTerm.trim());

        const resp = await fetch(`${API_BASE}/api/delivery/cdek/pvz?${qs.toString()}`);
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        const data = await resp.json();
        if (!aborted) setPvzList(Array.isArray(data.points) ? data.points : []);
      } catch (e) {
        if (!aborted) {
          console.error("pvz list load failed", e);
          setPvzList([]);
        }
      } finally {
        if (!aborted) setPvzLoading(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [deliveryType, selectedCity?.code, pvzTerm, pvzMode]);

  useEffect(() => {
    if (!selectedPvzCode) {
      setSelectedPvz(null);
      return;
    }
    const found = pvzList.find((p) => p.code === selectedPvzCode);
    if (found) setSelectedPvz(found);
  }, [selectedPvzCode, pvzList]);

  // ================= CDEK widget init (карта) =================
  useEffect(() => {
    if (deliveryType !== DELIVERY_TYPES.CDEK_PVZ) return;
    if (pvzMode !== "map") return;
    if (!selectedCity?.city) return;

    if (!YM_API_KEY) {
      console.warn("Missing REACT_APP_YMAPS_API_KEY");
      return;
    }

    // destroy previous
    if (widgetRef.current) {
      try {
        widgetRef.current.destroy();
      } catch {}
      widgetRef.current = null;
    }

    const weightKg = Math.max(0.1, Math.round((totalWeightGrams / 1000) * 10) / 10);

    const servicePath = `${API_BASE}/api/cdek-widget/service`;

    // IMPORTANT: root = "cdek-map", и DOM-элемент должен иметь id="cdek-map"
    const widget = new CDEKWidget({
      apiKey: YM_API_KEY,
      root: widgetRootId,
      servicePath,
      lang: "rus",
      currency: "RUB",
      hideDeliveryOptions: { door: true, office: false },
      popup: false,
      defaultLocation: `${selectedCity.city}${selectedCity.region ? ", " + selectedCity.region : ""}`,
      goods: [{ length: 10, width: 10, height: 10, weight: weightKg }],

      onChoose: (type, tariff, target) => {
        if (type !== "office") return;
        const office = target;
        const code = office?.code;
        if (!code) return;

        setSelectedPvzCode(code);
        setSelectedPvz({
          code: office.code,
          name: office.name || office.code,
          address: office.address,
          city_code: office.city_code,
          lat: office.location?.[0] ?? null,
          lon: office.location?.[1] ?? null,
          work_time: office.work_time || "",
          _fromWidget: true,
        });

        if (tariff) {
          setDeliveryPrice(Number(tariff.delivery_sum));
          const daysText =
            tariff.period_min && tariff.period_max
              ? tariff.period_min === tariff.period_max
                ? `${tariff.period_min} дн.`
                : `${tariff.period_min}–${tariff.period_max} дн.`
              : null;
          setDeliveryDays(daysText);
          setDeliveryCalcError("");
        }
      },
    });

    widgetRef.current = widget;

    // небольшой “пинок” для Telegram WebView (иногда нужно после рендера)
    const t = setTimeout(() => {
      try {
        window.dispatchEvent(new Event("resize"));
      } catch {}
    }, 300);

    return () => {
      clearTimeout(t);
      if (widgetRef.current) {
        try {
          widgetRef.current.destroy();
        } catch {}
        widgetRef.current = null;
      }
    };
  }, [deliveryType, pvzMode, selectedCity?.city, selectedCity?.region, totalWeightGrams]);

  // ================= расчет доставки (старый: бэком) =================
  useEffect(() => {
    setDeliveryCalcError("");

    if (deliveryType === DELIVERY_TYPES.PICKUP) {
      setDeliveryPrice(null);
      setDeliveryDays(null);
      return;
    }

    if (deliveryType === DELIVERY_TYPES.CDEK_PVZ && selectedPvz?._fromWidget) {
      return;
    }

    if (!cart || !cart.length || !totalWeightGrams) {
      setDeliveryPrice(null);
      setDeliveryDays(null);
      return;
    }

    let url = `${API_BASE}/api/delivery/cdek/calc?delivery_type=${deliveryType}&weight_grams=${totalWeightGrams}`;

    if (deliveryType === DELIVERY_TYPES.CDEK_PVZ) {
      if (!selectedCity?.code) return;
      url += `&to_city_code=${selectedCity.code}`;
    } else if (deliveryType === DELIVERY_TYPES.CDEK_DOOR) {
      return;
    }

    let cancelled = false;
    setDeliveryCalcLoading(true);

    (async () => {
      try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        const data = await resp.json();
        if (cancelled) return;

        if (data.ok && data.price != null) {
          setDeliveryPrice(Number(data.price));
          let daysText = null;
          if (data.period_min && data.period_max) {
            daysText =
              data.period_min === data.period_max
                ? `${data.period_min} дн.`
                : `${data.period_min}–${data.period_max} дн.`;
          }
          setDeliveryDays(daysText);
        } else {
          setDeliveryPrice(null);
          setDeliveryDays(null);
          setDeliveryCalcError("Не удалось рассчитать доставку");
        }
      } catch (e) {
        if (cancelled) return;
        console.error("cdek calc failed", e);
        setDeliveryPrice(null);
        setDeliveryDays(null);
        setDeliveryCalcError("Не удалось рассчитать доставку");
      } finally {
        if (!cancelled) setDeliveryCalcLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [deliveryType, selectedCity?.code, selectedPvz, totalWeightGrams, cart]);

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

      if (saveProfile) {
        try {
          localStorage.setItem(
            LOCAL_KEY,
            JSON.stringify({
              name,
              phone,
              tgHandle,
              deliveryType,
            })
          );
        } catch {}

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
        deliveryPayload = { type: DELIVERY_TYPES.PICKUP, title: "Самовывоз (г. Москва)" };
      } else if (deliveryType === DELIVERY_TYPES.CDEK_DOOR) {
        deliveryPayload = {
          type: DELIVERY_TYPES.CDEK_DOOR,
          calc_price: deliveryPrice,
          calc_days: deliveryDays,
        };
      } else if (deliveryType === DELIVERY_TYPES.CDEK_PVZ) {
        deliveryPayload = {
          type: DELIVERY_TYPES.CDEK_PVZ,
          city: selectedCity || null,
          pvz_code: selectedPvzCode,
          pvz: selectedPvz || null,
          calc_price: deliveryPrice,
          calc_days: deliveryDays,
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
          (data && (data.detail || data.message || data.error)) || `HTTP ${res.status}`
        );
      }

      clearCart();
      showSuccess(`Заказ №${data.order_id} отправлен!\nМенеджер свяжется с вами в ближайшее время.`);
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
          <Input placeholder="tg @" value={tgHandle} onChange={(e) => setTgHandle(e.target.value)} />
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

        {deliveryType === DELIVERY_TYPES.CDEK_PVZ && (
          <Field>
            <FieldLabel>Город СДЭК:</FieldLabel>

            <Input
              placeholder="Начните вводить город (например: Моск)"
              value={cdekCityQuery}
              onChange={(e) => {
                setCdekCityQuery(e.target.value);
                setSelectedCity(null);
              }}
            />

            {cdekCityLoading && <Hint>Ищем города…</Hint>}

            {!cdekCityLoading && cdekCityQuery.trim().length >= 2 && !selectedCity && (
              <>
                {cdekCityList.length === 0 && <Hint>Города не найдены</Hint>}
                {cdekCityList.length > 0 && (
                  <CityList>
                    {cdekCityList.map((c) => {
                      const label = `${c.city}${c.region ? ", " + c.region : ""}`;
                      return (
                        <CityItem
                          key={`${c.code}-${label}`}
                          type="button"
                          onClick={() => {
                            setSelectedCity(c);
                            setCdekCityQuery(label);
                            setCdekCityList([]);
                          }}
                        >
                          <b>{label}</b>
                          <small>code: {c.code}</small>
                        </CityItem>
                      );
                    })}
                  </CityList>
                )}
              </>
            )}

            {selectedCity?.code && (
              <SelectedCityLine>
                Выбран: <b>{cdekCityQuery}</b> • code: <b>{selectedCity.code}</b>
              </SelectedCityLine>
            )}

            {!!selectedCity?.code && (
              <>
                <FieldLabel style={{ marginTop: 6 }}>ПВЗ СДЭК:</FieldLabel>

                <PvzTabs>
                  <TabBtn
                    type="button"
                    $active={pvzMode === "list"}
                    onClick={() => setPvzMode("list")}
                  >
                    Список
                  </TabBtn>
                  <TabBtn
                    type="button"
                    $active={pvzMode === "map"}
                    onClick={() => setPvzMode("map")}
                  >
                    Карта
                  </TabBtn>
                </PvzTabs>

                {pvzMode === "list" && (
                  <>
                    <Input
                      placeholder="Поиск ПВЗ: адрес / название / метро"
                      value={pvzTerm}
                      onChange={(e) => setPvzTerm(e.target.value)}
                    />

                    {pvzLoading && <Hint>Загружаем ПВЗ…</Hint>}

                    {!pvzLoading && (
                      <>
                        {pvzList.length === 0 && <Hint>ПВЗ для этого города не найдены</Hint>}
                        {pvzList.length > 0 && (
                          <PvzList>
                            {pvzList.map((p) => (
                              <PvzItem key={p.code}>
                                <label>
                                  <input
                                    type="radio"
                                    name="pvz"
                                    value={p.code}
                                    checked={selectedPvzCode === p.code}
                                    onChange={() => {
                                      setSelectedPvzCode(p.code);
                                      setSelectedPvz({ ...p, _fromWidget: false });
                                    }}
                                  />
                                  <span>
                                    <b>{p.name || p.code}</b>
                                    <br />
                                    {p.address}
                                  </span>
                                </label>
                              </PvzItem>
                            ))}
                          </PvzList>
                        )}
                      </>
                    )}
                  </>
                )}

                {pvzMode === "map" && (
                  <>
                    {!YM_API_KEY ? (
                      <Hint>
                        ⚠ Нет ключа Яндекса. Добавь <b>REACT_APP_YMAPS_API_KEY</b> в .env
                      </Hint>
                    ) : (
                      <MapWrap>
                        {/* ВАЖНО: id должен быть widgetRootId (cdek-map) */}
                        <MapInner id={widgetRootId} />
                      </MapWrap>
                    )}
                    <Hint>
                      Выберите ПВЗ на карте — появится выбранный пункт и расчёт (если тариф пришёл из виджета).
                    </Hint>
                  </>
                )}
              </>
            )}
          </Field>
        )}

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
            Доставка СДЭК:&nbsp;
            {deliveryCalcLoading
              ? "рассчитываем…"
              : deliveryPrice != null
              ? `${deliveryPrice.toLocaleString("ru-RU")} ₽${deliveryDays ? ` • ${deliveryDays}` : ""}`
              : "будет рассчитана позже"}
          </DeliverySummary>
        )}

        {deliveryCalcError && <Hint>⚠ {deliveryCalcError}</Hint>}
        {error && <ErrorText>{error}</ErrorText>}

        <SubmitRow>
          <SubmitBtn
            type="submit"
            disabled={!canSubmit || sending}
            {...makePointerPress((isPressed) => setPressedId(isPressed ? "submit" : null))}
            $pressed={pressedId === "submit"}
          >
            {sending ? "Отправляем…" : "Отправить"}
          </SubmitBtn>
        </SubmitRow>
      </FormCard>
    </Page>
  );
}

/* ============= styles ============= */

const Page = styled.main`
  min-height: 100dvh;
  background: #000;
  color: #fff;
  padding: 12px var(--side-pad, 16px) calc(110px + env(safe-area-inset-bottom));
  font-family: "Montserrat", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
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

const MapWrap = styled.div`
  width: 100%;
  /* по высоте — чтобы нормально работало на телефонах в Telegram */
  height: min(62vh, 520px);
  min-height: 340px;

  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #222;
  background: #0f0f0f;

  /* root должен быть “чистым” */
  padding: 0;
  margin: 0;
  position: relative;
`;

const MapInner = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const IconImg = styled.img`
  width: 50px;
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

const PvzList = styled.div`
  max-height: 220px;
  overflow-y: auto;
  border-radius: 10px;
  border: 1px solid #222;
  background: #141414;
  margin-top: 4px;
`;

const PvzItem = styled.div`
  padding: 8px 10px;
  border-bottom: 1px solid #222;
  font-size: 12px;

  &:last-child {
    border-bottom: none;
  }

  label {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    cursor: pointer;
  }

  input {
    margin-top: 3px;
  }

  span {
    color: #e6e6e6;
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

const CityList = styled.div`
  margin-top: 4px;
  border-radius: 10px;
  border: 1px solid #222;
  background: #141414;
  overflow: hidden;
`;

const CityItem = styled.button`
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  padding: 10px 12px;
  color: #e6e6e6;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;

  b {
    font-size: 13px;
  }

  small {
    opacity: 0.75;
    white-space: nowrap;
  }

  &:hover {
    background: #1c1c1c;
  }
`;

const SelectedCityLine = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: #d0d0d0;
`;

const PvzTabs = styled.div`
  margin-top: 6px;
  display: flex;
  gap: 8px;
`;

const TabBtn = styled.button`
  height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  border: 2px solid ${(p) => (p.$active ? "#f5b300" : "#222")};
  background: ${(p) => (p.$active ? "#f5b300" : "#121212")};
  color: ${(p) => (p.$active ? "#000" : "#e6e6e6")};
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
`;
