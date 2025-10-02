// src/pages/PrivacyPage.jsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import GlobalLayout from "../components/GlobalLayout";

export default function PrivacyPage() {
  const [html, setHtml] = useState("");

  useEffect(() => {
    fetch("/privacy.html")
      .then(res => res.text())
      .then(setHtml)
      .catch(err => console.error("Ошибка загрузки политики:", err));
  }, []);

  return (
    <GlobalLayout topBarTitle="Политика конфиденциальности">
      <Card>
        <Content dangerouslySetInnerHTML={{ __html: html }} />
      </Card>
    </GlobalLayout>
  );
}

/* ===================== styled ===================== */

const Card = styled.div`
  background: #000;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 10px;
`;

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
  }

  strong, b {
    font-weight: 700;
  }

  ul, ol {
    padding-left: 20px;
    margin-bottom: 12px;
  }

  li {
    font-size: 14px;
    line-height: 1.6;
  }
`;
