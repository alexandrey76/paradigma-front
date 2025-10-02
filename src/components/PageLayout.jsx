// src/components/PageLayout.jsx
import React from "react";
import styled from "styled-components";

export default function PageLayout({ children, navHeight = 64, maxWidth = "900px" }) {
  return (
    <Wrap style={{ 
      ["--nav-h" /* eslint-disable-line */]: `${navHeight}px`, 
      ["--max-w" /* eslint-disable-line */]: maxWidth 
    }}>
      <Inner>{children}</Inner>
    </Wrap>
  );
}

const Wrap = styled.main`
  min-height: 100svh;
  box-sizing: border-box;
  background: #000;
  color: #fff;
  font-family: "Montserrat", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;

  /* Убрали padding-bottom отсюда - он будет в Inner */
  padding: 12px var(--side-pad, 16px);

  display: flex;
  justify-content: center;
`;

const Inner = styled.div`
  width: 100%;
  max-width: var(--max-w);
  
  /* Добавили padding-bottom в Inner */
  padding-bottom: calc(var(--nav-h) + env(safe-area-inset-bottom) + 12px);
`;