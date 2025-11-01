// src/pages/SupportPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";

const API_BASE =
  process.env.REACT_APP_API_BASE ||
  "https://alexandrey76-paradigma-back-c956.twc1.net";

const PUB = process.env.PUBLIC_URL || "";

export default function SupportPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [question, setQuestion] = useState("");
  const [pref, setPref] = useState("write"); // write | call

  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // ---------- автонаполнение ----------
  useEffect(() => {
    const tg = window?.Telegram?.WebApp;
    const u = tg?.initDataUnsafe?.user;

    // имя из Telegram (можно править)
    if (u?.first_name && !name) {
      setName(u.first_name);
    }

    // телефон из бэка (если есть)
    (async () => {
      try {
        const initData = tg?.initData || "";
        const res = await fetch(`${API_BASE}/api/profile`, {
          headers: { "X-Telegram-Init-Data": initData },
        });
        if (!res.ok) return;
        const data = await res.json();
        const raw = String(data?.profile?.user_phone || "").trim();
        const digits = raw.replace(/\D/g, "");
        if (digits.length === 11) {
          setPhone(formatPhoneFromDigits(digits));
        }
      } catch {
        /* ignore */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phoneOk = useMemo(() => {
    const digits = phone.replace(/\D/g, "");
    return digits.length === 11;
  }, [phone]);

  // теперь можно отправлять без галок
  const canSend =
    name.trim().length > 0 &&
    question.trim().length > 0 &&
    (pref === "write" || (pref === "call" && phoneOk));

  // --------- helpers для попапов ----------
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

  async function onSubmit(e) {
    e?.preventDefault?.();
    if (!canSend) return;

    setSending(true);
    setError("");

    try {
      const tgwa = window.Telegram?.WebApp;
      const initData = tgwa?.initData || "";
      const u = tgwa?.initDataUnsafe?.user;

      const payload = {
        type: "support_request",
        name: name.trim(),
        phone,
        question: question.trim(),
        preferred_contact: pref,
        // галок нет — шлём пустой объект
        agreements: {},
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

      // (опц.) шлём в миниапп
      try {
        tgwa?.sendData?.(
          JSON.stringify({
            type: "support_request",
            name,
            phone,
            question,
            preferred_contact: pref,
          })
        );
      } catch {}

      showSuccess("Заявка отправлена. Мы свяжемся с вами!");
      navigate(-1);
    } catch (e) {
      console.error(e);
      const msg = String(e.message || e);
      setError(msg);
      showError(msg);
    } finally {
      setSending(false);
    }
  }

  // формат к +7 (xxx) xxx-xx-xx
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

  return (
    <Page>
      <TopBar title="Поддержка" hideBack />

      <Card as="form" onSubmit={onSubmit}>
        <Head>
          <IconImg src={`${PUB}/assets/images/feedback.svg`} alt="Поддержка" />
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
            onChange={(e) => setPhone(formatPhoneFromDigits(e.target.value))}
            placeholder="+7 (___) ___-__-__"
            inputMode="tel"
          />
          {pref === "call" && !phoneOk && phone.length > 2 && (
            <Hint>Введите телефон в формате +7 (999) 123-45-67</Hint>
          )}
        </Field>

        <Field>
          <InputQuestion
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Опишите вашу проблему или вопрос"
            required
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
            <span>Напишите мне</span>
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

const Card = styled.section`
  border: 1px solid #2c2c2c;
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

const IconImg = styled.img`
  width: 250px;
  height: auto;
  margin-bottom: 8px;
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
  border: 2px solid #222;
  background: #2c2c2c;
  color: #fff;
  padding: 0 12px;

  &:focus {
    outline: none;
    border-color: #f5b300;
  }
`;

const InputQuestion = styled.textarea`
  min-height: 120px;
  border-radius: 10px;
  border: 2px solid #222;
  background: #2c2c2c;
  color: #fff;
  padding: 12px;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;

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
    transition: color 0.15s ease;
  }

  ${RadioHidden}:checked + span {
    color: #ffffff;
    font-weight: 500;
  }
`;

const RadioMark = styled.span`
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 1.5px solid #9e9e9e;
  display: inline-block;
  box-sizing: border-box;
  position: relative;
  transition: all 0.15s ease;

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
