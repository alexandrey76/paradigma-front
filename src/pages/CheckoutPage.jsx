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

const YMAPS_API_KEY = process.env.REACT_APP_YMAPS_API_KEY || "";

const LOCAL_KEY = "checkout_profile.v1";

const DELIVERY_TYPES = {
  PICKUP: "pickup",
  CDEK_PVZ: "cdek_pvz",
  CDEK_DOOR: "cdek_door",
};

// ====== small helpers ======
function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function safeJsonParse(x) {
  try {
    return JSON.parse(x);
  } catch {
    return null;
  }
}

// ====== Yandex Map loader ======
let __ymaps_loading = false;
let __ymaps_loaded = false;
function loadYmaps(apiKey) {
  if (__ymaps_loaded) return Promise.resolve(true);
  if (__ymaps_loading) {
    return new Promise((resolve) => {
      const i = setInterval(() => {
        if (__ymaps_loaded) {
          clearInterval(i);
          resolve(true);
        }
      }, 100);
    });
  }

  __ymaps_loading = true;

  return new Promise((resolve, reject) => {
    if (!apiKey) {
      reject(new Error("REACT_APP_YMAPS_API_KEY не задан"));
      return;
    }
    const existing = document.querySelector('script[data-ymaps="1"]');
    if (existing) {
      // уже есть, ждём ymaps.ready
      const i = setInterval(() => {
        if (window.ymaps && window.ymaps.ready) {
          window.ymaps.ready(() => {
            __ymaps_loaded = true;
            __ymaps_loading = false;
            clearInterval(i);
            resolve(true);
          });
        }
      }, 100);
      return;
    }

    const s = document.createElement("script");
    s.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(
      apiKey
    )}&lang=ru_RU`;
    s.async = true;
    s.dataset.ymaps = "1";
    s.onload = () => {
      if (!window.ymaps?.ready) {
        __ymaps_loading = false;
        reject(new Error("Yandex Maps API не загрузился"));
        return;
      }
      window.ymaps.ready(() => {
        __ymaps_loaded = true;
        __ymaps_loading = false;
        resolve(true);
      });
    };
    s.onerror = () => {
      __ymaps_loading = false;
      reject(new Error("Не удалось загрузить Yandex Maps API"));
    };
    document.head.appendChild(s);
  });
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, total, clearCart } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [tgHandle, setTgHandle] = useState("");
  const [comment, setComment] = useState("");

  const [deliveryType, setDeliveryType] = useState(DELIVERY_TYPES.PICKUP);

  // ===== CDEK: city + pvz + address =====
  const [cityQuery, setCityQuery] = useState("");
  const [cityList, setCityList] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null); // {code, city, region, sub_region, country_code, ...}

  const [pvzFilter, setPvzFilter] = useState("");
  const [pvzList, setPvzList] = useState([]);
  const [pvzLoading, setPvzLoading] = useState(false);
  const [selectedPvzCode, setSelectedPvzCode] = useState("");
  const [selectedPvz, setSelectedPvz] = useState(null);

  const [address, setAddress] = useState("");

  // ===== view mode: list/map =====
  const [pvzView, setPvzView] = useState("list"); // "list" | "map"

  // ===== delivery calc =====
  const [deliveryPrice, setDeliveryPrice] = useState(null);
  const [deliveryDays, setDeliveryDays] = useState(null);
  const [deliveryCalcLoading, setDeliveryCalcLoading] = useState(false);
  const [deliveryCalcError, setDeliveryCalcError] = useState("");

  const [saveProfile, setSaveProfile] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [pressedId, setPressedId] = useState(null);

  const PUB = process.env.PUBLIC_URL || "";

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

    if (deliveryType === DELIVERY_TYPES.CDEK_PVZ) {
      if (!selectedCity?.code) return false;
      if (!selectedPvzCode) return false;
    }

    if (deliveryType === DELIVERY_TYPES.CDEK_DOOR) {
      if (!selectedCity?.code) return false;
      if (!address.trim()) return false;
    }

    return true;
  }, [name, phoneOk, cart, deliveryType, selectedCity, address, selectedPvzCode]);

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

  // ================= init fill =================
  useEffect(() => {
    const tg = window?.Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;

    // 1) localStorage
    try {
      const savedRaw = localStorage.getItem(LOCAL_KEY);
      if (savedRaw) {
        const saved = safeJsonParse(savedRaw);
        if (saved?.name) setName(saved.name);
        if (saved?.phone) setPhone(saved.phone);
        if (saved?.tgHandle) setTgHandle(saved.tgHandle);
        if (saved?.deliveryType) setDeliveryType(saved.deliveryType);
      }
    } catch {
      /* ignore */
    }

    // 2) Telegram user
    if (user && !name) {
      const fullName = `${user.first_name || ""}${
        user.last_name ? " " + user.last_name : ""
      }`.trim();
      if (fullName) setName(fullName);
    }
    if (user && !tgHandle) {
      if (user.username) setTgHandle("@" + user.username);
    }

    // 3) profile from backend
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

  // ================= city autocomplete =================
  const debouncedCityFetch = useMemo(
    () =>
      debounce(async (q) => {
        const query = q.trim();
        if (query.length < 2) {
          setCityList([]);
          return;
        }
        setCityLoading(true);
        try {
          const resp = await fetch(
            `${API_BASE}/api/delivery/cdek/cities?query=${encodeURIComponent(query)}`
          );
          if (!resp.ok) throw new Error("HTTP " + resp.status);
          const data = await resp.json();
          const items = Array.isArray(data?.cities) ? data.cities : Array.isArray(data) ? data : [];
          setCityList(items);
        } catch (e) {
          console.error("cities load failed", e);
          setCityList([]);
        } finally {
          setCityLoading(false);
        }
      }, 250),
    []
  );

  useEffect(() => {
    if (deliveryType === DELIVERY_TYPES.CDEK_PVZ || deliveryType === DELIVERY_TYPES.CDEK_DOOR) {
      debouncedCityFetch(cityQuery);
    }
  }, [cityQuery, deliveryType, debouncedCityFetch]);

  function selectCity(city) {
    setSelectedCity(city);
    const display = [city.city, city.region].filter(Boolean).join(", ");
    setCityQuery(display || city.city || "");
    setCityList([]);

    // смена города — сбрасываем выбор ПВЗ
    setSelectedPvzCode("");
    setSelectedPvz(null);
    setPvzFilter("");
  }

  // ================= load PVZ for city =================
  useEffect(() => {
    if (deliveryType !== DELIVERY_TYPES.CDEK_PVZ) return;
    if (!selectedCity?.code) {
      setPvzList([]);
      return;
    }

    let cancelled = false;
    setPvzLoading(true);

    (async () => {
      try {
        const resp = await fetch(
          `${API_BASE}/api/delivery/cdek/pvz?city_code=${encodeURIComponent(selectedCity.code)}`
        );
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        const data = await resp.json();
        const points = Array.isArray(data?.points) ? data.points : [];
        if (!cancelled) setPvzList(points);
      } catch (e) {
        console.error("pvz load failed", e);
        if (!cancelled) setPvzList([]);
      } finally {
        if (!cancelled) setPvzLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [deliveryType, selectedCity]);

  // sync selected pvz object
  useEffect(() => {
    if (!selectedPvzCode) {
      setSelectedPvz(null);
      return;
    }
    const found = pvzList.find((p) => p.code === selectedPvzCode);
    setSelectedPvz(found || null);
  }, [selectedPvzCode, pvzList]);

  // filter pvz client-side by address/name/metro
  const filteredPvz = useMemo(() => {
    const q = pvzFilter.trim().toLowerCase();
    if (!q) return pvzList;

    return pvzList.filter((p) => {
      const name = String(p.name || "").toLowerCase();
      const addr = String(p.address || "").toLowerCase();
      const metro = String(p.metro || p.nearest_metro_station || "").toLowerCase();
      return name.includes(q) || addr.includes(q) || metro.includes(q);
    });
  }, [pvzList, pvzFilter]);

  // ================= delivery calc =================
  useEffect(() => {
    setDeliveryCalcError("");

    if (deliveryType === DELIVERY_TYPES.PICKUP) {
      setDeliveryPrice(null);
      setDeliveryDays(null);
      return;
    }

    if (!cart || !cart.length || !totalWeightGrams) {
      setDeliveryPrice(null);
      setDeliveryDays(null);
      return;
    }

    if (!selectedCity?.code) {
      setDeliveryPrice(null);
      setDeliveryDays(null);
      return;
    }

    // PVZ: нужен выбранный ПВЗ (для UX), но city_code уже есть => можем считать по городу
    if (deliveryType === DELIVERY_TYPES.CDEK_PVZ && !selectedPvzCode) {
      setDeliveryPrice(null);
      setDeliveryDays(null);
      return;
    }

    // DOOR: нужен адрес
    if (deliveryType === DELIVERY_TYPES.CDEK_DOOR && !address.trim()) {
      setDeliveryPrice(null);
      setDeliveryDays(null);
      return;
    }

    const url =
      `${API_BASE}/api/delivery/cdek/calc?delivery_type=${encodeURIComponent(deliveryType)}` +
      `&to_city_code=${encodeURIComponent(selectedCity.code)}` +
      `&weight_grams=${encodeURIComponent(totalWeightGrams)}`;

    let cancelled = false;
    setDeliveryCalcLoading(true);

    (async () => {
      try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        const data = await resp.json();
        if (cancelled) return;

        if (data?.ok && data.price != null) {
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
        console.error("cdek calc failed", e);
        if (cancelled) return;
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
  }, [
    deliveryType,
    selectedCity,
    selectedPvzCode,
    address,
    totalWeightGrams,
    cart,
  ]);

  // ================= submit =================
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

      // save profile
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
        } catch {
          /* ignore */
        }

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
          city: selectedCity || null,
          address: address.trim(),
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
      const data = text ? safeJsonParse(text) : null;

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

        {(deliveryType === DELIVERY_TYPES.CDEK_PVZ ||
          deliveryType === DELIVERY_TYPES.CDEK_DOOR) && (
          <Field>
            <FieldLabel>Город:</FieldLabel>
            <Input
              placeholder="Начните вводить город (например: Моск...)"
              value={cityQuery}
              onChange={(e) => {
                setCityQuery(e.target.value);
                // если пользователь руками меняет — считаем, что выбор сбит
                setSelectedCity(null);
              }}
            />
            {cityLoading && <Hint>Ищем города…</Hint>}

            {!cityLoading && cityQuery.trim().length >= 2 && !selectedCity && (
              <>
                {cityList.length === 0 && <Hint>Города не найдены</Hint>}
                {cityList.length > 0 && (
                  <CityList>
                    {cityList.slice(0, 10).map((c) => {
                      const title = [
                        c.city,
                        c.sub_region,
                        c.region,
                      ].filter(Boolean).join(", ");
                      return (
                        <CityItem
                          key={String(c.code || title)}
                          type="button"
                          onClick={() => selectCity(c)}
                        >
                          <b>{c.city}</b>
                          <div>{[c.sub_region, c.region].filter(Boolean).join(", ")}</div>
                        </CityItem>
                      );
                    })}
                  </CityList>
                )}
              </>
            )}

            {selectedCity?.code && (
              <SelectedBadge>
                Выбран: <b>{[selectedCity.city, selectedCity.region].filter(Boolean).join(", ")}</b>
                <SmallMuted> • code: {selectedCity.code}</SmallMuted>
              </SelectedBadge>
            )}
          </Field>
        )}

        {deliveryType === DELIVERY_TYPES.CDEK_DOOR && (
          <Field>
            <FieldLabel>Адрес доставки:</FieldLabel>
            <TextArea
              placeholder="Улица, дом, квартира"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </Field>
        )}

        {deliveryType === DELIVERY_TYPES.CDEK_PVZ && (
          <Field>
            <FieldLabel>ПВЗ СДЭК:</FieldLabel>

            <SegmentRow>
              <SegBtn
                type="button"
                $active={pvzView === "list"}
                onClick={() => setPvzView("list")}
              >
                Список
              </SegBtn>
              <SegBtn
                type="button"
                $active={pvzView === "map"}
                onClick={() => setPvzView("map")}
              >
                Карта
              </SegBtn>
            </SegmentRow>

            <Input
              placeholder="Поиск ПВЗ: адрес / название / метро"
              value={pvzFilter}
              onChange={(e) => setPvzFilter(e.target.value)}
              disabled={!selectedCity?.code}
            />

            {!selectedCity?.code && <Hint>Сначала выберите город</Hint>}
            {pvzLoading && selectedCity?.code && <Hint>Загружаем ПВЗ…</Hint>}

            {!pvzLoading && selectedCity?.code && (
              <>
                {filteredPvz.length === 0 ? (
                  <Hint>ПВЗ не найдены (попробуйте другой фильтр)</Hint>
                ) : pvzView === "list" ? (
                  <PvzList>
                    {filteredPvz.map((p) => (
                      <PvzItem key={p.code}>
                        <label>
                          <input
                            type="radio"
                            name="pvz"
                            value={p.code}
                            checked={selectedPvzCode === p.code}
                            onChange={() => setSelectedPvzCode(p.code)}
                          />
                          <span>
                            <b>{p.name || p.code}</b>
                            <br />
                            {p.address}
                            {(p.metro || p.nearest_metro_station) && (
                              <>
                                <br />
                                <SmallMuted>
                                  метро: {p.metro || p.nearest_metro_station}
                                </SmallMuted>
                              </>
                            )}
                          </span>
                        </label>
                      </PvzItem>
                    ))}
                  </PvzList>
                ) : (
                  <PvzMap
                    apiKey={YMAPS_API_KEY}
                    city={selectedCity}
                    points={filteredPvz}
                    selectedCode={selectedPvzCode}
                    onSelect={(code) => setSelectedPvzCode(code)}
                  />
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
              ? `${deliveryPrice.toLocaleString("ru-RU")} ₽${
                  deliveryDays ? ` • ${deliveryDays}` : ""
                }`
              : "будет рассчитана позже"}
          </DeliverySummary>
        )}

        {deliveryCalcError && <Hint>⚠ {deliveryCalcError}</Hint>}
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
    </Page>
  );
}

// ====== Map component (Yandex) ======
function PvzMap({ apiKey, city, points, selectedCode, onSelect }) {
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const placemarksRef = useRef([]);

  // init map
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await loadYmaps(apiKey);
        if (cancelled) return;
        if (!boxRef.current) return;

        // cleanup old
        try {
          if (mapRef.current) {
            mapRef.current.destroy();
            mapRef.current = null;
          }
        } catch {
          /* ignore */
        }

        // default center: first PVZ, else "Moscow-ish"
        const first = points.find((p) => isFinite(p.latitude) && isFinite(p.longitude));
        const center = first
          ? [Number(first.latitude), Number(first.longitude)]
          : [55.751244, 37.618423];

        mapRef.current = new window.ymaps.Map(
          boxRef.current,
          {
            center,
            zoom: first ? 11 : 10,
            controls: ["zoomControl"],
          },
          { suppressMapOpenBlock: true }
        );

        // add markers
        placemarksRef.current = [];
        for (const p of points) {
          const lat = Number(p.latitude);
          const lon = Number(p.longitude);
          if (!isFinite(lat) || !isFinite(lon)) continue;

          const pm = new window.ymaps.Placemark(
            [lat, lon],
            {
              balloonContentHeader: `<b>${escapeHtml(p.name || p.code)}</b>`,
              balloonContentBody:
                `<div style="font-size:12px;">${escapeHtml(p.address || "")}</div>` +
                (p.metro || p.nearest_metro_station
                  ? `<div style="margin-top:6px;font-size:12px;opacity:.85;">метро: ${escapeHtml(
                      p.metro || p.nearest_metro_station
                    )}</div>`
                  : ""),
            },
            {
              preset:
                p.code === selectedCode
                  ? "islands#yellowIcon"
                  : "islands#grayIcon",
            }
          );

          pm.events.add("click", () => onSelect(p.code));
          mapRef.current.geoObjects.add(pm);
          placemarksRef.current.push({ code: p.code, pm });
        }

        // fit bounds if we have markers
        const coords = placemarksRef.current.map((x) => x.pm.geometry.getCoordinates());
        if (coords.length >= 2) {
          mapRef.current.setBounds(window.ymaps.util.bounds.fromPoints(coords), {
            checkZoomRange: true,
            zoomMargin: 30,
          });
        }
      } catch (e) {
        console.error("ymaps init error", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiKey, city?.code]); // re-init on city change

  // update markers on points/selection change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.ymaps) return;

    // remove old
    try {
      for (const { pm } of placemarksRef.current) {
        map.geoObjects.remove(pm);
      }
    } catch {
      /* ignore */
    }
    placemarksRef.current = [];

    // add new
    for (const p of points) {
      const lat = Number(p.latitude);
      const lon = Number(p.longitude);
      if (!isFinite(lat) || !isFinite(lon)) continue;

      const pm = new window.ymaps.Placemark(
        [lat, lon],
        {
          balloonContentHeader: `<b>${escapeHtml(p.name || p.code)}</b>`,
          balloonContentBody:
            `<div style="font-size:12px;">${escapeHtml(p.address || "")}</div>` +
            (p.metro || p.nearest_metro_station
              ? `<div style="margin-top:6px;font-size:12px;opacity:.85;">метро: ${escapeHtml(
                  p.metro || p.nearest_metro_station
                )}</div>`
              : ""),
        },
        {
          preset:
            p.code === selectedCode ? "islands#yellowIcon" : "islands#grayIcon",
        }
      );

      pm.events.add("click", () => onSelect(p.code));
      map.geoObjects.add(pm);
      placemarksRef.current.push({ code: p.code, pm });
    }
  }, [points, selectedCode, onSelect]);

  return (
    <MapWrap>
      {!apiKey ? (
        <MapError>
          Не задан <code>REACT_APP_YMAPS_API_KEY</code>
        </MapError>
      ) : (
        <MapBox ref={boxRef} />
      )}
    </MapWrap>
  );
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

  &:disabled {
    opacity: 0.7;
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

// cities dropdown
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
  padding: 10px 10px;
  border: none;
  background: transparent;
  color: #e6e6e6;
  cursor: pointer;
  border-bottom: 1px solid #222;

  &:last-child {
    border-bottom: none;
  }

  b {
    display: block;
    font-size: 13px;
  }

  div {
    font-size: 12px;
    opacity: 0.85;
    margin-top: 2px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
`;

const SelectedBadge = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: #e6e6e6;
`;

const SmallMuted = styled.span`
  font-size: 12px;
  opacity: 0.7;
`;

// list/map segmented
const SegmentRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
`;

const SegBtn = styled.button`
  height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  border: 2px solid ${(p) => (p.$active ? "#f5b300" : "#222")};
  background: ${(p) => (p.$active ? "#f5b300" : "#141414")};
  color: ${(p) => (p.$active ? "#000" : "#e6e6e6")};
  font-weight: 800;
  font-size: 12px;
  cursor: pointer;
`;

// map
const MapWrap = styled.div`
  margin-top: 6px;
  border-radius: 12px;
  border: 1px solid #222;
  overflow: hidden;
  background: #0f0f0f;
`;

const MapBox = styled.div`
  width: 100%;
  height: 320px;
`;

const MapError = styled.div`
  padding: 12px;
  color: #ffcb66;
  font-size: 12px;

  code {
    color: #fff;
  }
`;
