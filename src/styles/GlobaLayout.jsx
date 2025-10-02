// src/components/GlobalLayout.jsx
import React from "react";
import styled from "styled-components";
import NavBar from "./NavBar";
import TopBar from "./TopBar";

const NAVBAR_HEIGHT = 64; // высота нижнего NavBar

export default function GlobalLayout({ topBarTitle, children }) {
  return (
    <Wrapper>
      {topBarTitle && <TopBar title={topBarTitle} />}
      <Content>
        {children}
      </Content>
      <NavBar />
    </Wrapper>
  );
}

const Wrapper = styled.div`
  min-height: 100svh; /* безопасная высота viewport */
  display: flex;
  flex-direction: column;
  background: #000;
  color: #fff;
`;

const Content = styled.div`
  flex: 1;
  padding: 12px var(--side-pad, 16px);
  padding-bottom: calc(${NAVBAR_HEIGHT}px + env(safe-area-inset-bottom));
  box-sizing: border-box;
`;
