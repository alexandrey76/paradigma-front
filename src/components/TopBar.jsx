// src/components/TopBar.jsx
import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

export default function TopBar({ title, svgSrc, svgAlt }) {
  const navigate = useNavigate();
  const touchStartX = useRef(null);

  /* ===== свайп-назад ===== */
  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
      if (touchStartX.current === null) return;
      const diff = e.changedTouches[0].clientX - touchStartX.current;
      touchStartX.current = null;
      // если захочешь вернуть свайп-назад — тут можно diff > 60 && navigate(-1)
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [navigate]);

  return (
    <Bar>
      <BackButton onClick={() => navigate(-1)} aria-label="Назад">
        <img src="/assets/images/backArrow.svg" alt="Назад" />
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
  border-radius: 12px;
  padding: 6px 12px;
  /* 🔽 те же боковые отступы, что и у контента */
  margin: 8px var(--side-pad, 16px);
  height: 42px;
  box-sizing: border-box;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  margin-right: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;

  img {
    width: 12px;
    height: 12px;
    pointer-events: none;
  }

  &:active {
    transform: scale(0.94);
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
