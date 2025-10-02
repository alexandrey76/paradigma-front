// src/components/PageLayout.jsx
import React from "react";
import styled from "styled-components";

export default function PageLayout({ children, maxWidth = "900px" }) {
  return (
    <Layout>
      <Content style={{ ["--max-w"]: maxWidth }}>
        {children}
      </Content>
    </Layout>
  );
}

const Layout = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  display: flex;
  flex-direction: column;
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 16px;
  padding-bottom: calc(64px + env(safe-area-inset-bottom) + 20px);
  
  & > * {
    width: 100%;
    max-width: var(--max-w);
    margin-left: auto;
    margin-right: auto;
  }
`;