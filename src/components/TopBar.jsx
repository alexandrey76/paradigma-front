// src/components/TopBar.jsx
import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

const Bar = styled.div`
  display: flex;
  align-items: center;
  background: white;
  border-radius: 10px;
  padding: 10px 14px;
  margin: 10px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  margin-right: 10px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 14px;
    height: 14px;
  }
`;

const Title = styled.div`
  font-weight: bold;
  font-size: 14px;
  color: #000;
`;

const SvgIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  
  img, svg {
    width: auto;
    height: 18px; /* Настройте под ваш SVG */
    max-width: 100%;
  }
`;

export default function TopBar({ title, svgSrc, svgAlt }) {
  const navigate = useNavigate();

  return (
    <Bar>
      <BackButton onClick={() => navigate(-1)}>
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