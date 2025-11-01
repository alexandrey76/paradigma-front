// src/components/TopBar.jsx
import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

export default function TopBar({ title, svgSrc, svgAlt, hideBack = false }) {
  const navigate = useNavigate();
  const touchStartX = useRef(null);

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
      {!hideBack ? (
        <BackButton onClick={() => navigate(-1)} aria-label="Назад">
          <img src="/assets/images/backArrow.svg" alt="Назад" />
        </BackButton>
      ) : (
        // пустой «спейсер», чтобы центр не прыгал
        <BackSpacer aria-hidden="true" />
      )}

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
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;   /* центрируем содержимое */
  background: #fff;
  border-radius: 10px;
  padding: 6px 12px;
  height: 42px;
  margin: 8px 0 14px;
  width: 100%;
  box-sizing: border-box;
`;

const BACK_SIZE = 36;

const BackButton = styled.button`
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  width: ${BACK_SIZE}px;
  height: ${BACK_SIZE}px;
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
    transform: translateY(-50%) scale(0.94);
  }
`;

// такой же по размеру, как кнопка — только невидимый
const BackSpacer = styled.div`
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: ${BACK_SIZE}px;
  height: ${BACK_SIZE}px;
`;

const Title = styled.div`
  font-weight: 700;
  font-size: 14px;
  color: #000;
  text-align: center;
  line-height: 1.2;
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
