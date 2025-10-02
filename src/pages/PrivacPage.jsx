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
      <ContentContainer>
        <StyledContent dangerouslySetInnerHTML={{ __html: html }} />
      </ContentContainer>
    </PageLayout>
  );
}

const ContentContainer = styled.div`
  background: #0b0b0b;
  border-radius: 12px;
  padding: 20px;
  margin-top: 16px;
`;

const StyledContent = styled.div`
  color: #dcdcdc;
  line-height: 1.6;
  
  /* Сбрасываем все возможные стили из HTML */
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0;
    font-size: 100%;
    font: inherit;
    vertical-align: baseline;
  }
  
  /* Базовые стили для HTML элементов */
  h1, h2, h3, h4, h5, h6 {
    font-weight: 800;
    margin: 20px 0 12px;
    color: #fff;
    line-height: 1.3;
  }
  
  h1 { font-size: 1.5em; }
  h2 { font-size: 1.3em; }
  h3 { font-size: 1.1em; }
  
  h1:first-child {
    margin-top: 0;
  }
  
  p {
    margin-bottom: 16px;
  }
  
  ul, ol {
    margin-bottom: 16px;
    padding-left: 24px;
  }
  
  li {
    margin-bottom: 8px;
  }
  
  a {
    color: #f5b300;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  strong, b {
    font-weight: 700;
  }
  
  em, i {
    font-style: italic;
  }
`;