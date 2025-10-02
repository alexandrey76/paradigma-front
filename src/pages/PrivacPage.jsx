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
    <PageContainer>
      <TopBar title="Политика конфиденциальности" />
      <ScrollContainer>
        <Content dangerouslySetInnerHTML={{ __html: html }} />
      </ScrollContainer>
    </PageContainer>
  );
}

const PageContainer = styled.div`
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #000;
  color: #fff;
  font-family: "Montserrat", system-ui, sans-serif;
`;

const ScrollContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 80px; /* Место для навбара */
`;

const Content = styled.div`
  color: #dcdcdc;
  line-height: 1.6;
  max-width: 100%;

  h1, h2, h3 { 
    font-weight: 800; 
    margin: 20px 0 12px; 
    color: #fff; 
  }
  
  h1:first-child { margin-top: 0; }
  
  p { 
    margin-bottom: 16px; 
  }
  
  ul, ol { 
    margin-bottom: 16px; 
    padding-left: 24px; 
  }
  
  a { color: #f5b300; }
`;