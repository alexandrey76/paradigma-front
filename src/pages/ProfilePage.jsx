// src/pages/ProfilePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import TopBar from "../components/TopBar";

const API_BASE =
  process.env.REACT_APP_API_BASE ||
  "https://alexandrey76-paradigma-back-c956.twc1.net";

const LOCAL_KEY = "profile.v1";

export default function ProfilePage() {
  const navigate = useNavigate();

  // Данные Telegram WebApp (если запущено в ТГ)
  const tgUser = useMemo(() => {
    try {
      return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
    } catch {
      return null;
    }
  }, []);

  // Локально сохранённые данные (fallback)
  const saved = useMemo(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  // Имя
  const defaultName =
    (tgUser &&
      `${tgUser.first_name || ""}${
        tgUser.last_name ? " " + tgUser.last_name : ""
      }`.trim()) ||
    saved?.name;

  // Аватар
  const defaultAvatar =
    (tgUser &&
      (tgUser.photo_url || tgUser.avatar_url || tgUser.picture || null)) ||
    saved?.avatar ||
    null;

  const [name] = useState(defaultName);
  const [avatar, setAvatar] = useState(defaultAvatar);
  const [phone, setPhone] = useState(saved?.phone || "+7 (800) 555 - 35 - 35");
  const [gender, setGender] = useState(
    saved?.gender || (tgUser?.gender ? tgUser.gender : "") || ""
  ); // 'male' | 'female' | ''

  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);

  // Реальное количество отправленных заявок с бэкенда
  const [sentCount, setSentCount] = useState(0);
  const [countLoading, setCountLoading] = useState(true);

  useEffect(() => {
    // Если из ТГ есть аватар — используем
    if (tgUser && !avatar) {
      const candidate =
        tgUser.photo_url || tgUser.avatar_url || tgUser.picture || null;
      if (candidate) setAvatar(candidate);
    }
  }, [tgUser, avatar]);

  // Загружаем количество заявок пользователя
  useEffect(() => {
    let aborted = false;

    async function fetchOrdersCount() {
      try {
        setCountLoading(true);

        const tg = window.Telegram?.WebApp;
        const initData = tg?.initData || "";
        const uid = tgUser?.id;

        if (!uid) {
          setSentCount(0);
          return;
        }

        const resp = await fetch(
          `${API_BASE}/api/orders/my-orders?tg_user_id=${uid}`,
          {
            method: "GET",
            headers: {
              "X-Telegram-Init-Data": initData || "",
            },
          }
        );

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const data = await resp.json();
        const list = Array.isArray(data?.orders) ? data.orders : [];
        if (!aborted) setSentCount(list.length);
      } catch (e) {
        console.warn("Failed to load orders count:", e);
        if (!aborted) setSentCount(0);
      } finally {
        if (!aborted) setCountLoading(false);
      }
    }

    fetchOrdersCount();
    return () => {
      aborted = true;
    };
  }, [tgUser]);

  // Валидация телефона (11 цифр)
  const phoneOk = useMemo(() => {
    const digits = phone.replace(/\D/g, "");
    return digits.length === 11;
  }, [phone]);

  const canSave = phoneOk;

  // Форматирование телефона
  function formatPhoneInputRaw(rawDigits) {
    let v = rawDigits.replace(/\D/g, "");
    if (v.startsWith("8")) v = "7" + v.slice(1);
    if (!v.startsWith("7")) v = "7" + v;

    let out = "+" + v.charAt(0);
    if (v.length > 1) {
      out += " (" + v.slice(1, 4);
    }
    if (v.length >= 5) {
      out += ") " + v.slice(4, 7);
    }
    if (v.length >= 8) {
      out += " - " + v.slice(7, 9);
    }
    if (v.length >= 10) {
      out += " - " + v.slice(9, 11);
    }
    return out;
  }

  function handlePhoneChangeInput(e) {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "");
    const formatted = formatPhoneInputRaw(digits);
    setPhone(formatted);
  }

  function startEditPhone() {
    setEditingPhone(true);
    setTimeout(() => {
      const el = document.getElementById("profile-phone-input");
      el?.focus();
      const len = el?.value?.length || 0;
      try {
        el.setSelectionRange(len, len);
      } catch {}
    }, 30);
  }

  function finishEditPhone() {
    setEditingPhone(false);
    const normalized = formatPhoneInputRaw(phone.replace(/\D/g, ""));
    setPhone(normalized);
  }

  async function handleSave(e) {
    e?.preventDefault?.();
    if (!canSave) {
      setError("Введите корректный телефон");
      return;
    }
    setSending(true);
    setError("");

    const payload = {
      name,
      phone,
      gender,
      avatar,
    };

    try {
      // локально
      localStorage.setItem(LOCAL_KEY, JSON.stringify(payload));

      // на бэк (не критично, если не получится)
      try {
        const tg = window.Telegram?.WebApp;
        const initData = tg?.initData || "";
        await fetch(`${API_BASE}/api/profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Telegram-Init-Data": initData || "",
          },
          body: JSON.stringify(payload),
        });
      } catch (netErr) {
        console.warn("Profile save network error:", netErr);
      }

      alert("Данные сохранены");
    } catch (err) {
      console.error(err);
      setError(String(err.message || err));
    } finally {
      setSending(false);
    }
  }

  // склонение "заявка/заявки/заявок"
  function pluralize(n, [one, few, many]) {
    const v = Math.abs(n) % 100;
    const v1 = v % 10;
    if (v > 10 && v < 20) return many;
    if (v1 > 1 && v1 < 5) return few;
    if (v1 === 1) return one;
    return many;
  }

  return (
    <Page>
      <TopBar title="Личный кабинет" />

      <Container>
        <Card as="form" onSubmit={handleSave}>
          <AvatarRow>
            <Avatar>
              {avatar ? (
                <img src={avatar} alt="avatar" width="42" height="42" />
              ) : (
                <DefaultAvatar>
                  <img
                    src={`${process.env.PUBLIC_URL}/assets/images/profileIcon.svg`}
                    alt="avatar"
                    width="34"
                    height="34"
                  />
                </DefaultAvatar>
              )}
            </Avatar>

            <FieldTitle>
              <FieldTitleText>{name}</FieldTitleText>
              <FieldSubText>
                {tgUser?.username ? `@${tgUser.username}` : ""}
              </FieldSubText>
            </FieldTitle>
          </AvatarRow>

          <Divider />

          {/* Номер телефона */}
          <ClickableRow onClick={() => !editingPhone && startEditPhone()}>
            <RowLeft>
              <RowLabel>Номер телефона</RowLabel>
              {!editingPhone ? (
                <RowValueSmall>{phone}</RowValueSmall>
              ) : (
                <PhoneEditWrap>
                  <PhoneInput
                    id="profile-phone-input"
                    value={phone}
                    onChange={handlePhoneChangeInput}
                    onBlur={finishEditPhone}
                    inputMode="tel"
                    aria-label="Номер телефона"
                  />
                </PhoneEditWrap>
              )}
            </RowLeft>
            <Arrow>›</Arrow>
          </ClickableRow>

          <Divider />

          {/* Пол */}
          <FieldRow>
            <RowLeft>
              <RowLabel>Пол</RowLabel>
              <GenderInline>
                <RadioLabel>
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={gender === "male"}
                    onChange={() => setGender("male")}
                  />
                  <FakeRadio $checked={gender === "male"} />
                  <span className="txt">Мужской</span>
                </RadioLabel>

                <RadioLabel>
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={gender === "female"}
                    onChange={() => setGender("female")}
                  />
                  <FakeRadio $checked={gender === "female"} />
                  <span className="txt">Женский</span>
                </RadioLabel>
              </GenderInline>
            </RowLeft>
          </FieldRow>

          <Divider />

          {/* Отправленные заявки */}
          <ClickableRow onClick={() => navigate("/orders")}>
            <RowLeft>
              <RowLabel>Отправленные заявки</RowLabel>
              <RowValueSmall>
                {countLoading ? "—" : sentCount}{" "}
                {!countLoading &&
                  pluralize(sentCount, ["заявка", "заявки", "заявок"])}
              </RowValueSmall>
            </RowLeft>
            <Arrow>›</Arrow>
          </ClickableRow>

          {error && <ErrorText>{error}</ErrorText>}

          <SaveRow>
            <SaveBtn type="submit" disabled={!canSave || sending}>
              {sending ? "Сохраняем…" : "Сохранить"}
            </SaveBtn>
          </SaveRow>
        </Card>
      </Container>
    </Page>
  );
}

/* ================= STYLES ================= */

const Page = styled.main`
  min-height: 100dvh;
  background: #000;
  color: #fff;
  padding: 12px var(--side-pad, 16px) calc(110px + env(safe-area-inset-bottom));
  font-family: "Montserrat", system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
`;

const Container = styled.div`
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
`;

const Card = styled.section`
  border: 2px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 14px;
  background: #0b0b0b;
`;

const AvatarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`;

const Avatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: #111;
  display: grid;
  place-items: center;
  overflow: hidden;
`;

const DefaultAvatar = styled.div`
  display: grid;
  place-items: center;
`;

const FieldTitle = styled.div`
  display: flex;
  flex-direction: column;
`;

const FieldTitleText = styled.div`
  font-weight: 800;
  font-size: 20px;
`;

const FieldSubText = styled.div`
  font-size: 13px;
  color: #bdbdbd;
  margin-top: 4px;
`;

const Divider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.04);
  margin: 8px 0;
`;

const ClickableRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 4px;
  cursor: pointer;
`;

const FieldRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 4px;
`;

const RowLeft = styled.div`
  display: flex;
  flex-direction: column;
`;

const RowLabel = styled.div`
  font-weight: 700;
  font-size: 16px;
`;

const RowValueSmall = styled.div`
  color: #cfcfcf;
  font-size: 14px;
  margin-top: 6px;
`;

const Arrow = styled.div`
  font-size: 20px;
  color: #cfcfcf;
  line-height: 1;
`;

const PhoneEditWrap = styled.div`
  margin-top: 6px;
  width: min(100%, 320px);
`;

const PhoneInput = styled.input`
  width: 100%;
  height: 44px;
  border-radius: 8px;
  border: 2px solid #222;
  background: #111;
  color: #fff;
  padding: 8px 12px;
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: #f5b300;
  }
`;

const GenderInline = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 6px;
`;

const RadioLabel = styled.label`
  display: inline-grid;
  grid-auto-flow: column;
  gap: 8px;
  align-items: center;
  padding: 6px 10px;
  border-radius: 10px;
  cursor: pointer;
  user-select: none;

  input {
    display: none;
  }

  .txt {
    font-size: 14px;
    color: #9e9e9e;
  }

  input:checked ~ .txt {
    color: #fff;
    font-weight: 600;
  }
`;

const FakeRadio = styled.span`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  box-sizing: border-box;
  border: 1.5px solid #9e9e9e;
  background: ${(p) => (p.$checked ? "#fff" : "transparent")};
`;

const ErrorText = styled.div`
  color: #ff6b6b;
  margin-top: 8px;
  font-size: 14px;
`;

const SaveRow = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-top: 12px;
`;

const SaveBtn = styled.button`
  width: 160px;
  height: 46px;
  border-radius: 10px;
  border: 2px solid #f5b300;
  background: #f5b300;
  color: #000;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;
