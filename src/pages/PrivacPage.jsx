// src/pages/PrivacyPage.jsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import TopBar from "../components/TopBar";
import PageLayout from "../components/PageLayout";

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
    <PageLayout>
      <TopBar title="Политика конфиденциальности" />
      <ContentCard>
        <Content dangerouslySetInnerHTML={{ __html: html }} />
      </ContentCard>
    </PageLayout>
  );
}

const ContentCard = styled.div`
  background: #0b0b0b;
  border-radius: 12px;
  padding: 20px;
  margin-top: 16px;
`;

const Content = styled.div`
  color: #dcdcdc;
  line-height: 1.6;

  h1, h2, h3 { 
    font-weight: 800; 
    margin: 20px 0 12px; 
    color: #fff; 
  }
  
  h1:first-child { margin-top: 0; }
  
  p { margin-bottom: 16px; }
  ul, ol { margin-bottom: 16px; padding-left: 24px; }
  a { color: #f5b300; }
`;