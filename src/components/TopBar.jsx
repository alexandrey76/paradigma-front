// src/components/TopBar.jsx
import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { useNavigate, useLocation } from "react-router-dom";

export default function TopBar({ title, svgSrc, svgAlt }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const touchStartX = useRef(null);

  // страницы, где стрелка НЕ нужна (туда можно попасть снизу)
  const hideBack =
    pathname === "/" ||
    pathname === "/catalog" ||
    pathname === "/cart" ||
    pathname === "/profile" ||
    pathname === "/support";

  /* ===== свайп-назад (пока пустой, но оставим) ===== */
  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = () => {
      touchStartX.current = null;
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <Bar>
      <BackButton
        onClick={() => !hideBack && navigate(-1)}
        aria-label={hideBack ? undefined : "Назад"}
        $hidden={hideBack}
      >
        <img src="/assets/images/backArrow.svg" alt="" />
      </BackButton>

      {title ? (
        <Title>{title}</Title>
      ) : (
        <SvgIcon>
          <img src={svgSrc} alt={svgAlt || "Icon"} />
        </SvgIcon>
      )}
    </Bar>
  );
}

/* ---------- styled ---------- */

const Bar = styled.div`
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 10px;
  padding: 6px 12px;
  height: 42px;
  margin: 8px 0 14px;
  width: 100%;
  box-sizing: border-box;
`;

const BackButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  margin-right: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
  outline: none;

  ${(p) =>
    p.$hidden &&
    `
    visibility: hidden;
    pointer-events: none;
  `}

  img {
    width: 12px;
    height: 12px;
    pointer-events: none;
  }

  &:active {
    transform: scale(0.94);
    background: transparent;
  }
`;

const Title = styled.div`
  font-weight: 700;
  font-size: 14px;
  color: #000;
`;

const SvgIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  img,
  svg {
    height: 16px;
    width: auto;
    max-width: 100%;
  }
`;
