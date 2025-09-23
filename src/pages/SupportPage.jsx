// src/pages/SupportPage.jsx
import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

const API_BASE =
  process.env.REACT_APP_API_BASE ||
  "https://alexandrey76-paradigma-back-c956.twc1.net";

export default function SupportPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [tg, setTg] = useState(""); // @username
  const [pref, setPref] = useState("write"); // write | call
  const [agree1, setAgree1] = useState(false); // обязательное согласие
  const [agree2, setAgree2] = useState(false); // необязательное

  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // простая проверка телефона: + и 10–14 цифр
  const phoneOk = useMemo(
    () => /^\+?\d{7,15}$/.test(phone.replace(/\s|\(|\)|-/g, "")),
    [phone]
  );

  const canSend = name.trim() && phoneOk && agree1;

  async function onSubmit(e) {
    e?.preventDefault?.();
    if (!canSend) return;

    setSending(true);
    setError("");

    try {
      const tgwa = window.Telegram?.WebApp;
      const initData = tgwa?.initData || "";
      const u = tgwa?.initDataUnsafe?.user;

      // Отправляем на бэк
      const payload = {
        type: "support_request",
        name: name.trim(),
        phone,
        tg: tg?.trim() || null,
        preferred_contact: pref, // write | call
        agreements: { privacy: agree1, promo: agree2 },
        tg_context: {
          user_id: u?.id ?? null,
          username: u?.username ?? null,
          first_name: u?.first_name ?? null,
          init_data: initData,
        },
      };

      const res = await fetch(`${API_BASE}/api/support`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": initData,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        let msg = "";
        try {
          msg = JSON.parse(text)?.detail || text;
        } catch {
          msg = text || `HTTP ${res.status}`;
        }
        throw new Error(msg);
      }

      try {
        tgwa?.sendData?.(
          JSON.stringify({
            type: "support_request",
            name,
            phone,
            tg,
            preferred_contact: pref,
          })
        );
      } catch {}

      alert("Заявка отправлена. Мы свяжемся с вами!");
      navigate(-1);
    } catch (e) {
      console.error(e);
      setError(String(e.message || e));
    } finally {
      setSending(false);
    }
  }

  return (
    <Page>
      <TopBar>
          <BackArrow aria-label="Назад" onClick={() => navigate(-1)}>
            <img src={`${PUB}/assets/images/backArrow.svg`} alt="Назад" width="14" height="14" />
          </BackArrow>
          <Brand>
            <Logo src={`${PUB}/assets/images/topLogo.svg`} alt="Paradigma" />
          </Brand>
        </TopBar>

      <Card as="form" onSubmit={onSubmit}>
        <Head>
          <IconImg
            src={`${process.env.PUBLIC_URL}/assets/images/feedback.svg`}
            alt="Поддержка"
          />
        </Head>

        <Field>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Введите ваше имя"
            autoComplete="name"
            required
          />
        </Field>

        <Field>
            <Input
                value={phone}
                onChange={(e) => {
                let v = e.target.value.replace(/\D/g, ""); // только цифры
                if (v.startsWith("7")) {
                    v = v
                } else if (v.startsWith("8")) {
                    v = "7" + v.slice(1); // заменяем 8 на 7
                } else if (!v.startsWith("7")) {
                    v = "7" + v; // по умолчанию добавляем 7
                }

                let formatted = "+7";
                if (v.length > 1) formatted += " (" + v.slice(1, 4);
                if (v.length >= 5) formatted += ") " + v.slice(4, 7);
                if (v.length >= 8) formatted += "-" + v.slice(7, 9);
                if (v.length >= 10) formatted += "-" + v.slice(9, 11);

                setPhone(formatted);
                }}
                placeholder="+7 (___) ___-__-__"
                inputMode="tel"
                required
            />
            {!phoneOk && phone.length > 2 && (
                <Hint>Введите телефон в формате +7 (999) 123-45-67</Hint>
            )}
        </Field>

        <Field>
          <Input
            value={tg}
            onChange={(e) => setTg(e.target.value.replace(/\s/g, ""))}
            placeholder="tg @"
          />
        </Field>

            <RowRadio>
            <RadioLabel>
                <RadioHidden
                type="radio"
                name="pref"
                checked={pref === "write"}
                onChange={() => setPref("write")}
                />
                <RadioMark aria-hidden="true" />
            </RadioLabel>

            <RadioLabel>
                <RadioHidden
                type="radio"
                name="pref"
                checked={pref === "call"}
                onChange={() => setPref("call")}
                />
                <RadioMark aria-hidden="true" />
                <span>Позвоните мне</span>
            </RadioLabel>
            </RowRadio>

        <CheckItem>
            <input
                type="checkbox"
                checked={agree1}
                onChange={(e) => setAgree1(e.target.checked)}
            />
            <span className="mark" />
            <span className="text">
                Я даю согласие на обработку своих персональных данных в соответствии с
                политикой конфиденциальности
            </span>
        </CheckItem>

            {/* Согласие №2 (дополнительное) */}
        <CheckItem>
            <input
                type="checkbox"
                checked={agree2}
                onChange={(e) => setAgree2(e.target.checked)}
            />
            <span className="mark" />
            <span className="text">
                Я даю согласие на получение рекламной и информационной рассылки
            </span>
        </CheckItem>

        {error && <ErrorText>{error}</ErrorText>}

        <Submit type="submit" disabled={!canSend || sending}>
          {sending ? "Отправляем…" : "Оставить заявку"}
        </Submit>
      </Card>
    </Page>
  );
}

/* ==================== styled ==================== */
const Page = styled.main`
  min-height: 100dvh;
  background: #000;
  color: #fff;
  padding: 12px var(--side-pad, 16px) calc(110px + env(safe-area-inset-bottom));
  font-family: "Montserrat", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
`;

const PUB = process.env.PUBLIC_URL || "";
const CHECK_ON  = `${PUB}/assets/images/check_on.svg`; 
const CHECK_OFF = `${PUB}/assets/images/check_off.svg`;

const TopBar = styled.header`
  background: #fff;
  color: #000;
  border-radius: 10px;
  height: 44px;
  display: grid;
  grid-template-columns: 40px 1fr;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  margin-bottom: 10px;
`;
const BackArrow = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 4px;
`;
const Brand = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end; /* прижали вправо */
  padding-right: 8px;        /* небольшой отступ справа */
`;

const Logo = styled.img`
  height: 18px;
  width: auto;
`;

const Card = styled.section`
  border: 1px solid #ffffffff;
  border-radius: 14px;
  padding: 18px;
  background: #0b0b0b;
`;

const Head = styled.div`
  display: grid;
  justify-items: center;
  gap: 6px;
  margin-bottom: 12px;

  h1 {
    font-size: 18px;
    font-weight: 800;
    margin: 0;
    text-align: center;
  }
`;


const CheckItem = styled.label`
  display: grid;
  grid-template-columns: 18px 1fr;
  gap: 10px;
  align-items: start;
  cursor: pointer;
  user-select: none;
  margin: 10px 0;

  /* скрываем нативный checkbox */
  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  /* иконка */
  .mark {
    width: 18px;
    height: 18px;
    background: url(${CHECK_OFF}) center/contain no-repeat;
    margin-top: 2px;          /* чуть ниже, чтобы выровнять по тексту */
    transition: filter .15s ease;
  }

  /* текст */
  .text {
    font-size: 14px;
    line-height: 1.35;
    color: #bdbdbd;           /* серый для неактивного */
    transition: color .15s ease, font-weight .15s ease;
  }

  /* когда чекбокс отмечен — меняем иконку и текст */
  input:checked + .mark {
    background-image: url(${CHECK_ON});
  }
  input:checked ~ .text {
    color: #ffffff;           /* белый */
    font-weight: 600;         /* как на рефе */
  }
`;

const IconImg = styled.img`
  width: 250px;   
  height: auto;
  margin-bottom: 5px;
`;

const Field = styled.div`
  display: grid;
  gap: 6px;
  margin-bottom: 12px;

  label {
    font-size: 13px;
    color: #eedfdfff;
  }
`;
const Input = styled.input`
  height: 42px;
  border-radius: 10px;
  border: 2px solid #0f0b01ff;
  background: #454545B8;
  color: #ffffffff;
  padding: 0 12px;

  &:focus {
    outline: none;
    border-color: #f5b300;
  }
`;
const Hint = styled.div`
  color: #ffcb66;
  font-size: 12px;
`;

const RowRadio = styled.div`
  display: flex;
  gap: 28px;  
  margin: 10px 0 12px;
`;

const RadioHidden = styled.input`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
`;

const RadioLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  position: relative;


  span {
    font-size: 13px;
    color: #9e9e9e;          
    transition: color .15s ease;
  }

  ${RadioHidden}:checked ~ span {
    color: #ffffff;
    font-weight: 500;
  }
`;


const RadioMark = styled.span`
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 1.5px solid #9e9e9e; /* серый контур */
  display: inline-block;
  box-sizing: border-box;
  position: relative;
  transition: all .15s ease;

  /* Активное состояние: белая заливка + белый контур */
  ${RadioHidden}:checked + & {
    border-color: #ffffff;
    background: #ffffff;
  }
`;

const ErrorText = styled.div`
  color: #ff6b6b;
  margin-top: 4px;
  font-size: 14px;
`;

const Submit = styled.button`
  width: 100%;
  height: 46px;
  margin-top: 14px;
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
