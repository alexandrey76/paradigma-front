// src/pages/ConsentPage.jsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import TopBar from "../components/TopBar";

export default function ConsentPage() {
  const [html, setHtml] = useState("");

  useEffect(() => {
    fetch("/consent.html")
      .then((res) => res.text())
      .then(setHtml)
      .catch((err) => console.error("Ошибка загрузки consent.html:", err));
  }, []);

  return (
    <Page>
      <TopBar title="Согласие на обработку ПД" />
      <Content
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Page>
  );
}

/* ============ styled ============ */
const Page = styled.main`
  min-height: 100dvh;
  background: #000;
  color: #fff;
  padding: 12px var(--side-pad, 16px) calc(110px + env(safe-area-inset-bottom));
  font-family: "Montserrat", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;

  a {
    color: #f5b300;
    text-decoration: underline;
  }
`;

const Content = styled.div`
  max-width: 720px;
  margin: 0 auto;
  line-height: 1.6;
  font-size: 14px;

  h1, h2, h3 {
    font-weight: 700;
    margin: 18px 0 10px;
  }

  p {
    margin: 0 0 14px;
  }

  ul, ol {
    margin: 0 0 14px 20px;
    padding: 0;
  }

  li {
    margin-bottom: 8px;
  }
`;
