// src/components/PageLayout.jsx
import React from "react";
import styled from "styled-components";

export default function PageLayout({ children, maxWidth = "900px" }) {
  return (
    <Layout style={{ ["--max-w"]: maxWidth }}>
      {children}
    </Layout>
  );
}

const Layout = styled.main`
  min-height: 100vh;
  background: #000;
  color: #fff;
  font-family: "Montserrat", system-ui, sans-serif;
  padding: 0 16px;
  padding-bottom: calc(64px + env(safe-area-inset-bottom) + 24px);
  
  /* Центрирование контента */
  & > * {
    width: 100%;
    max-width: var(--max-w);
    margin-left: auto;
    margin-right: auto;
  }
`;