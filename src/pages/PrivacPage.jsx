// src/pages/PrivacyPage.jsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import TopBar from "../components/TopBar";

export default function PrivacyPage() {
  const [html, setHtml] = useState("");

  useEffect(() => {
    fetch("/privacy.html")
      .then((r) => r.text())
      .then(setHtml)
      .catch((e) => {
        console.error("Ошибка загрузки privacy:", e);
        setHtml("<p>Не удалось загрузить политику.</p>");
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

/* ===== styled ===== */
const Page = styled.main`
  min-height: 100svh;
  background: #000;
  color: #fff;
  padding: 12px var(--side-pad, 16px);
  padding-bottom: calc(64px + env(safe-area-inset-bottom) + 24px);
  font-family: "Montserrat", system-ui, sans-serif;
`;

const Card = styled.div`
  background: #0b0b0b;
  border-radius: 12px;
  padding: 14px;
  margin-top: 12px;
`;

const Content = styled.div`
  color: #dcdcdc;

  h1, h2, h3 { font-weight: 800; margin: 20px 0 10px; color: #fff; }
  p { margin-bottom: 12px; line-height: 1.6; }
  ul, ol { margin-bottom: 12px; padding-left: 18px; }
  a { color: #f5b300; }
`;