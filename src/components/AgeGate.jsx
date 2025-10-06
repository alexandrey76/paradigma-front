// src/components/AgeGate.jsx
import React, { useEffect } from "react";
import styled from "styled-components";

/**
 * AgeGate — простой попап подтверждения, что пользователю >= 18.
 * - Сохраняет подтверждение в localStorage ("age_verified" = "1")
 * - Если пользователь нажмёт «мне еще нет 18 лет» — попытается закрыть мини-приложение.
 *
 * Props:
 *  - open (bool)
 *  - onClose() callback — вызывается после подтверждения
 */
export default function AgeGate({ open, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && open) {
        // не закрываем на Esc, т.к. хотим, чтобы пользователь подтвердил возраст
        // но можно позволить закрыть — закомментируй ниже если надо
        // tryClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const PUB = process.env.PUBLIC_URL || "";

  const confirm = () => {
    try {
      localStorage.setItem("age_verified", "1");
    } catch (e) {}
    onClose?.();
  };

  const reject = () => {
    // Если есть Telegram WebApp, закрываем его, иначе переходим на blank
    try {
      const tg = window.Telegram?.WebApp;
      if (tg?.close) {
        tg.close();
        return;
      }
    } catch (e) {
      // ignore
    }
    // fallback
    window.location.href = "about:blank";
  };

  return (
    <Overlay role="dialog" aria-modal="true" aria-label="Подтверждение возраста">
      <Card>
        <CloseHint aria-hidden="true"> </CloseHint>

        <IconWrap>
          <img src={`${PUB}/assets/images/paradigmaLogoo.svg`} alt="" />
        </IconWrap>

        <Title>Приветствую, Мой Друг!</Title>
        <Sub>
          Чтобы продолжить, подтверди, <strong>что тебе есть 18</strong>
        </Sub>

        <Buttons>
          <BtnPrimary onClick={confirm} autoFocus>
            мне есть 18 лет
          </BtnPrimary>
          <BtnSecondary onClick={reject}>мне еще нет 18 лет</BtnSecondary>
        </Buttons>
      </Card>
    </Overlay>
  );
}

/* ========== styled ========== */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: grid;
  place-items: center;
  background: rgba(0,0,0,0.6);
  padding: 20px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  background: #fff;
  color: #000;
  border-radius: 14px;
  padding: 22px;
  box-shadow: 0 14px 40px rgba(0,0,0,0.5);
  text-align: center;
`;

const IconWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
  img {
    height: 28px;
    width: auto;
  }
`;

const Title = styled.h2`
  margin: 6px 0 6px;
  font-size: 18px;
  font-weight: 800;
`;

const Sub = styled.p`
  margin: 0 0 18px;
  color: #444;
  font-size: 14px;
  strong { color: #000; }
`;

const Buttons = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr;
  margin-top: 6px;
`;

const Btn = styled.button`
  height: 46px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  border: none;
`;

const BtnPrimary = styled(Btn)`
  background: #f5b300;
  color: #000;
  border: 2px solid #f5b300;
`;

const BtnSecondary = styled(Btn)`
  background: #000;
  color: #fff;
  border: 2px solid #000;
`;

const CloseHint = styled.div`
  position: absolute;
  left: 8px;
  top: 8px;
  width: 18px;
  height: 18px;
  opacity: 0.001; /* декоративно — не показываем, но элемент есть для aria */
`;
