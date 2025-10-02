// src/components/PageLayout.jsx
import React from "react";
import styled from "styled-components";

/**
 * PageLayout — обёртка для страниц.
 * Автоматически добавляет padding-bottom = NAVBAR_HEIGHT + safe-area-inset,
 * центрирует контент и даёт базовые отступы.
 *
 * props:
 *   children — контент страницы
 *   navHeight (number) — высота NavBar в px (по умолчанию 64)
 *   maxWidth (string) — макс. ширина контента (по умолчанию "900px")
 */
export default function PageLayout({ children, navHeight = 64, maxWidth = "900px" }) {
  return (
    <Wrap style={{ ["--nav-h" /* eslint-disable-line */]: `${navHeight}px`, ["--max-w" /* eslint-disable-line */]: maxWidth }}>
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

  /* общий padding (вертикальный/горизонтальный) */
  padding: 12px var(--side-pad, 16px);

  /* ЗАЗОР под NavBar: navHeight + safe-area */
  padding-bottom: calc(var(--nav-h) + env(safe-area-inset-bottom) + 12px);

  display: flex;
  justify-content: center; /* центрируем внутр. контейнер */
`;

/* Inner — ограничивает ширину контента и даёт выравнивание */
const Inner = styled.div`
  width: 100%;
  max-width: var(--max-w);
`;
