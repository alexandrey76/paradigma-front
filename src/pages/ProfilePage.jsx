// src/pages/ProfilePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

const API_BASE =
  process.env.REACT_APP_API_BASE ||
  "https://alexandrey76-paradigma-back-c956.twc1.net";

const LOCAL_KEY = "profile.v1";
const SENT_REQS_KEY = "sentRequests.v1";

export default function ProfilePage() {
  const navigate = useNavigate();

  // Попытка получить данные из Telegram WebApp
  const tgUser = useMemo(() => {
    try {
      return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
    } catch {
      return null;
    }
  }, []);

  // Сохранённые данные (fallback)
  const saved = useMemo(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  // Имя берём в порядке: tgUser.first_name (+ last_name) -> saved -> дефолт
  const defaultName =
    (tgUser && `${tgUser.first_name || ""}${tgUser.last_name ? " " + tgUser.last_name : ""}`.trim()) ||
    saved?.name ||
    "Валерчик";

  // Аватар: Telegram WebApp обычно не даёт прямой url, но пытаем возможные поля — иначе fallback
  const defaultAvatar =
    (tgUser && (tgUser.photo_url || tgUser.avatar_url || tgUser.picture || null)) ||
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

  const sentCount = useMemo(() => {
    try {
      const raw = localStorage.getItem(SENT_REQS_KEY);
      return raw ? Number(raw) : 1;
    } catch {
      return 0;
    }
  }, []);

  useEffect(() => {
    // если tgUser доступен и имеет аватар, попробовать использовать
    if (tgUser && !avatar) {
      const candidate = tgUser.photo_url || tgUser.avatar_url || tgUser.picture || null;
      if (candidate) setAvatar(candidate);
    }
  }, [tgUser, avatar]);

  // Простая валидация номера (цифры 7..15)
  const phoneDigits = phone.replace(/\D/g, "");
  const phoneOk = /^\d{7,15}$/.test(phoneDigits);

  const canSave = phoneOk;

  // Форматирование номера при вводе (поддерживает ввод цифр, добавляет +7 (xxx) xxx - xx - xx)
  function formatPhoneInputRaw(rawDigits) {
    let v = rawDigits.replace(/\D/g, "");
    // если пользователь вводит с ведущим 8 — заменим на 7
    if (v.startsWith("8")) v = "7" + v.slice(1);
    if (!v.startsWith("7")) {
      // если не начинается с 7 — добавим 7 (российский)
      v = "7" + v;
    }
    // собираем формат
    let out = "+" + v.charAt(0);
    if (v.length > 1) {
      const a = v.slice(1, 4);
      out += " (" + a;
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
    // оставим только цифры и плюс (удалим лишнее)
    const digits = raw.replace(/\D/g, "");
    const formatted = formatPhoneInputRaw(digits);
    setPhone(formatted);
  }

  function startEditPhone() {
    setEditingPhone(true);
    // фокус позже (через nextTick) — используем setTimeout
    setTimeout(() => {
      const el = document.getElementById("profile-phone-input");
      el?.focus();
      // поставить caret в конец
      const len = el?.value?.length || 0;
      try {
        el.setSelectionRange(len, len);
      } catch {}
    }, 30);
  }

  function finishEditPhone() {
    setEditingPhone(false);
    // можно дополнительно нормализовать
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
      // локально сохраняем
      localStorage.setItem(LOCAL_KEY, JSON.stringify(payload));

      // отправляем на бэк (если нужно)
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
        // не критично — просто логируем
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

  // если пользователь кликнул на аватар — ничего не меняем (не просили менять)
  return (
    <Page>
      <TopBar>
        <TopBarInner>
          <Back onClick={() => navigate(-1)} aria-label="Назад">
            <img
              src={`${process.env.PUBLIC_URL}/assets/images/backArrow.svg`}
              alt="Назад"
              width="14"
              height="14"
            />
          </Back>

          <TitlePill>
            <PillIcon>
              <img
                src={`${process.env.PUBLIC_URL}/assets/images/profileIcon.svg`}
                alt="icon"
                width="18"
                height="18"
              />
            </PillIcon>
            <PillText>Имя</PillText>
          </TitlePill>

          <Brand>
            <img
              src={`${process.env.PUBLIC_URL}/assets/images/paradigmaLogoo.svg`}
              alt="Paradigma"
              height="18"
            />
          </Brand>
        </TopBarInner>
      </TopBar>

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
              <FieldSubText>{tgUser?.username ? `@${tgUser.username}` : ""}</FieldSubText>
            </FieldTitle>
          </AvatarRow>

          <Divider />

          {/* Номер телефона — кликабельная строка; при клике появляется inline input */}
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

          {/* Пол — только один выбор */}
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
            <Arrow>›</Arrow>
          </FieldRow>

          <Divider />

          <FieldRow>
            <RowLeft>
              <RowLabel>Отправленные заявки</RowLabel>
              <RowValueSmall>{sentCount} заявка</RowValueSmall>
            </RowLeft>
            <Arrow>›</Arrow>
          </FieldRow>

          {error && <ErrorText>{error}</ErrorText>}
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

const TopBar = styled.header`
  margin-bottom: 14px;
  display: flex;
  justify-content: center;
`;

const TopBarInner = styled.div`
  width: 100%;
  max-width: 560px;
  background: #fff;
  color: #000;
  border-radius: 12px;
  height: 52px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 10px;
  box-sizing: border-box;
`;

const Back = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: transparent;
  border: none;
  cursor: pointer;
`;

const TitlePill = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PillIcon = styled.div`
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
`;

const PillText = styled.div`
  font-weight: 800;
  font-size: 16px;
`;

const Brand = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 96px;
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
