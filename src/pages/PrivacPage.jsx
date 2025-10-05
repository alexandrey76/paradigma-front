// src/pages/PrivacyPage.jsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import TopBar from "../components/TopBar";
import NavBar from "../components/NavBar";

export default function PrivacyPage() {
  const [content, setContent] = useState("");

  useEffect(() => {
    // Загружаем локальный HTML-файл политики
    fetch("/privacy.html")
      .then((res) => res.text())
      .then(setContent)
      .catch((err) => console.error("Ошибка загрузки политики:", err));
  }, []);

  return (
    <>
      <TopBar title="Политика конфиденциальности" />
      <Main>
        <Card dangerouslySetInnerHTML={{ __html: content }} />
      </Main>
      <NavBar />
    </>
  );
}

/* ---------- styled ---------- */

const Main = styled.main`
  min-height: 100svh;
  background: #000;
  color: #fff;
  font-family: "Montserrat", system-ui, sans-serif;

  /* отступы, чтобы контент не упирался в NavBar */
  padding: 80px var(--side-pad, 16px)
    calc(90px + env(safe-area-inset-bottom));
  box-sizing: border-box;
`;

const Card = styled.div`
  max-width: 900px;
  margin: 0 auto;
  font-size: 14px;
  line-height: 1.6;
  color: #fff;

  h1,
  h2,
  h3 {
    font-weight: 800;
    margin: 20px 0 10px;
  }

  p {
    margin-bottom: 12px;
  }

  ul,
  ol {
    margin: 10px 0 12px 20px;
  }

  li {
    margin-bottom: 8px;
  }

  strong,
  b {
    font-weight: 700;
  }
`;
