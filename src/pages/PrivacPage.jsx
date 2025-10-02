// src/pages/PrivacyPage.jsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import TopBar from "../components/TopBar";

const NAVBAR_HEIGHT = 64; // высота нижнего NavBar в px — если у тебя другая, поправь

export default function PrivacyPage() {
  const [html, setHtml] = useState("");

  useEffect(() => {
    fetch("/privacy.html")
      .then((res) => res.text())
      .then(setHtml)
      .catch((err) => {
        console.error("Ошибка загрузки политики:", err);
        setHtml("<p>Ошибка загрузки политики конфиденциальности.</p>");
      });
  }, []);

  return (
    <Page>
      <TopBar title="Политика конфиденциальности" />
      <Card>
        <Content dangerouslySetInnerHTML={{ __html: html }} />
      </Card>
    </Page>
  );
}

/* ===================== styled ===================== */

const Page = styled.main`
  /* используем d(v)h чтобы корректно работать в моб.мини-аппах */
  min-height: 100dvh;
  background: #000;
  color: #fff;
  font-family: "Montserrat", system-ui, sans-serif;
  box-sizing: border-box;

  /* боковые паддинги, можно менять через --side-pad */
  padding: 12px var(--side-pad, 16px);

  /* отступ снизу, чтобы контент не перекрывался фиксированным NavBar.
     Учитываем safe-area inset для iPhone с вырезом. */
  padding-bottom: calc(${NAVBAR_HEIGHT}px + 20px + env(safe-area-inset-bottom));
`;

/* Внутренняя "карта" с контентом */
const Card = styled.div`
  background: #0b0b0b;
  color: #fff;
  max-width: 900px;
  margin: 0 auto;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
`;

/* Сам HTML контент политики */
const Content = styled.div`
  color: #fff;

  h1, h2, h3 {
    font-weight: 800;
    margin: 20px 0 10px;
  }

  p {
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 12px;
    color: #dcdcdc;
  }

  strong, b {
    font-weight: 700;
  }

  ul, ol {
    padding-left: 20px;
    margin-bottom: 12px;
    color: #dcdcdc;
  }

  li {
    font-size: 14px;
    line-height: 1.6;
  }

  a {
    color: #f5b300;
    text-decoration: underline;
  }

  /* если embedded images / iframe — делаем адаптивными */
  img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 8px 0;
  }

  iframe {
    width: 100%;
    border: none;
  }
`;
