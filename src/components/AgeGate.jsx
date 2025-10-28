// src/components/AgeGate.jsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";

export default function AgeGate({ open, onClose, persist = false }) {
  const [agree, setAgree] = useState(false);
  const [mode, setMode] = useState("form"); // "form" | "denied"

  const PUB = process.env.PUBLIC_URL || "";
  const CHECK_ON  = `${PUB}/assets/images/check_on.svg`;
  const CHECK_OFF = `${PUB}/assets/images/check_off.svg`;
  const PRIVACY_URL =
    "https://alexandrey76-paradigma-front-5b56.twc1.net/privacy.html";

  // хук всегда вызывается (без условных возвратов выше)
  useEffect(() => {
    const onKey = (e) => {
      if (!open) return;
      if (e.key === "Escape") {
        // блокируем закрытие по Esc
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const confirm = () => {
    if (!agree) return;
    try {
      if (persist) localStorage.setItem("age_verified", "1");
      else localStorage.removeItem("age_verified");
    } catch {}
    onClose?.();
  };

  const reject = () => setMode("denied");
  const back = () => setMode("form");

  // условный РЕНДЕР — без условных хуков
  return !open ? null : (
    <Overlay role="dialog" aria-modal="true" aria-label="Подтверждение возраста">
      <Card>
        {mode === "form" ? (
          <>
            <IconWrap>
              <img src={`${PUB}/assets/images/paradigmaLogoo.svg`} alt="" />
            </IconWrap>

            <Title>Приветствую, Мой Друг!</Title>
            <Sub>Чтобы продолжить, подтверди, что тебе есть 18</Sub>
            <Hint>Да, даже кальяны будущего требуют соблюдения правил ;)</Hint>

            <Buttons>
              <BtnPrimary onClick={confirm} disabled={!agree} aria-disabled={!agree}>
                мне есть 18 лет
              </BtnPrimary>
              <BtnSecondary onClick={reject}>мне еще нет 18 лет</BtnSecondary>
            </Buttons>

            <ConsentWrap>
              <ConsentRow>
                <CheckboxButton
                  type="button"
                  aria-label={agree ? "Согласие дано" : "Дать согласие"}
                  onClick={() => setAgree((v) => !v)}
                >
                  <img
                    src={agree ? CHECK_ON : CHECK_OFF}
                    alt=""
                    width="24"
                    height="24"
                  />
                </CheckboxButton>

                <ConsentText>
                  Я даю согласие на обработку своих персональных данных в
                  соответствии с{" "}
                  <a href={PRIVACY_URL} target="_blank" rel="noreferrer">
                    политикой конфиденциальности
                  </a>
                </ConsentText>
              </ConsentRow>
            </ConsentWrap>
          </>
        ) : (
          <>
            <Title style={{ marginTop: 4 }}>Приходите позже!</Title>
            <Sub style={{ marginBottom: 18 }}>
              Приложение содержит информацию, предназначенную только для лиц
              старше 18 лет
            </Sub>
            <Buttons>
              <BtnPrimary onClick={back}>Назад</BtnPrimary>
            </Buttons>
          </>
        )}
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
  max-width: 520px;
  background: #fff;
  color: #000;
  border-radius: 24px;
  padding: 22px 18px 18px;
  box-shadow: 0 14px 40px rgba(0,0,0,0.5);
  text-align: center;
`;

const IconWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
  img { height: 28px; width: auto; }
`;

const Title = styled.h2`
  margin: 6px 0 6px;
  font-size: 24px;
  line-height: 1.15;
  font-weight: 800;
`;

const Sub = styled.p`
  margin: 0;
  color: #333;
  font-size: 18px;
  line-height: 1.25;
`;

const Hint = styled.p`
  margin: 6px 0 14px;
  color: #7a7a7a;
  font-size: 12px;
`;

const Buttons = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr;
  margin: 2px 0 8px;
`;

const Btn = styled.button`
  height: 56px;
  border-radius: 18px;
  font-weight: 800;
  font-size: 18px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: opacity .15s ease, transform .04s ease, background .15s ease, border-color .15s ease;
  &:active { transform: translateY(1px); }
  &:disabled, &[aria-disabled="true"] { opacity: .6; cursor: default; }
`;

const BtnPrimary = styled(Btn)`
  background: ${(p) => (p.disabled ? "#f5d67a" : "#f5b300")};
  color: #000;
  border-color: ${(p) => (p.disabled ? "#7bb0ff" : "#f5b300")};
`;

const BtnSecondary = styled(Btn)`
  background: #000;
  color: #fff;
  border-color: #000;
`;

const ConsentWrap = styled.div`
  margin-top: 10px;
  display: grid;
  place-items: center;
`;

const ConsentRow = styled.div`
  display: grid;
  grid-template-columns: 24px 1fr;
  align-items: start;
  gap: 10px;
  width: 100%;
  max-width: 420px;
`;

const CheckboxButton = styled.button`
  border: none;
  padding: 0;
  background: transparent;
  width: 24px;
  height: 24px;
  line-height: 0;
  display: grid;
  place-items: center;
  cursor: pointer;
  margin-top: 1px;
`;

const ConsentText = styled.div`
  text-align: left;
  color: #333;
  font-size: 13px;
  line-height: 1.35;

  a {
    color: #f5b300;
    text-decoration: underline;
  }
`;
