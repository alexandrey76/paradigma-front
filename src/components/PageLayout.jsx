// src/components/PageLayout.jsx
import React from "react";
import styled from "styled-components";

export default function PageLayout({ children, navHeight = 64, maxWidth = "900px" }) {
  return (
    <LayoutContainer>
      <ContentWrapper style={{ 
        ["--nav-h"]: `${navHeight}px`, 
        ["--max-w"]: maxWidth 
      }}>
        {children}
      </ContentWrapper>
    </LayoutContainer>
  );
}

const LayoutContainer = styled.div`
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #000;
  position: fixed; /* Фиксируем весь layout */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden; /* Убираем скролл у контейнера */
`;

const ContentWrapper = styled.main`
  flex: 1;
  overflow-y: auto; /* Скролл только внутри контента */
  overflow-x: hidden;
  padding: 0 var(--side-pad, 16px);
  padding-bottom: calc(var(--nav-h) + env(safe-area-inset-bottom) + 12px);
  
  /* Центрирование контента */
  display: flex;
  flex-direction: column;
  
  & > * {
    width: 100%;
    max-width: var(--max-w);
    margin: 0 auto;
  }
  
  /* Отступы для контента */
  & > *:first-child {
    margin-top: 12px;
  }
  
  & > *:last-child {
    margin-bottom: 12px;
  }
`;