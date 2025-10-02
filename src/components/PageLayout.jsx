// src/components/PageLayout.jsx
import React from "react";
import styled from "styled-components";

export default function PageLayout({ children, navHeight = 64, maxWidth = "900px" }) {
  return (
    <Wrap style={{ 
      ["--nav-h"]: `${navHeight}px`, 
      ["--max-w"]: maxWidth 
    }}>
      <Inner>{children}</Inner>
    </Wrap>
  );
}

const Wrap = styled.main`
  min-height: 100vh;
  min-height: 100dvh; /* Современная альтернатива */
  background: #000;
  color: #fff;
  font-family: "Montserrat", system-ui, sans-serif;
  
  /* Только горизонтальные паддинги */
  padding: 0 var(--side-pad, 16px);
  
  display: flex;
  flex-direction: column;
`;

const Inner = styled.div`
  width: 100%;
  max-width: var(--max-w);
  margin: 0 auto;
  flex: 1;
  
  /* Вертикальные паддинги и отступ для навбара */
  padding: 12px 0;
  padding-bottom: calc(var(--nav-h) + env(safe-area-inset-bottom) + 24px);
`;