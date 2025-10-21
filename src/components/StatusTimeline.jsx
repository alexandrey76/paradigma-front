// StatusTimeline.jsx
import React, { useMemo } from "react";
import styled from "styled-components";

const STEPS = [
  "Создана",
  "Обработана",
  "Товар готов к отправке",
  "Товар готов к получению",
  "Выполнена",
];

function statusToIndex(s) {
  const t = String(s || "").toLowerCase();
  if (t.includes("создан")) return 0;
  if (t.includes("обработ")) return 1;
  if (t.includes("отправ")) return 2;
  if (t.includes("получ")) return 3;
  if (t.includes("выполн")) return 4;
  return 0;
}

export default function StatusTimeline({ currentStatus, currentIndex, times }) {
  const idx = useMemo(() => (
    Number.isInteger(currentIndex) ? Math.max(0, Math.min(4, currentIndex)) : statusToIndex(currentStatus)
  ), [currentIndex, currentStatus]);

  return (
    <List>
      {STEPS.map((label, i) => {
        const activeDot = i <= idx;
        const activeLine = i < idx;
        const isLast = i === STEPS.length - 1;
        const date = times?.[i] || "";

        return (
          <Item key={label} $lineActive={activeLine} $isLast={isLast}>
            <Dot $active={activeDot} />
            <div className="content">
              <div className="label">{label}</div>
              {date ? <div className="date">{date}</div> : null}
            </div>
          </Item>
        );
      })}
    </List>
  );
}

/* ========== styles  ========== */
const YELLOW = "#f5b300";
const LINE_INACTIVE = "rgba(255,255,255,.18)";
const TEXT_MUTED = "rgba(255,255,255,.62)";

const List = styled.ul`
  --rail: 22px;        /* колонка под точки */
  --dot: 14px;         /* диаметр точки */
  --line-gap: 2px;     /* ЗАЗОР от точки до линии сверху (сделай 0–2px) */
  --line-extend: 1.2px;  /* насколько ВЫТЯНУТЬ линию вверх+вниз */
  margin: 0;
  padding: 6px 0;
  list-style: none;
`;

const Item = styled.li`
  position: relative;
  display: grid;
  grid-template-columns: var(--rail) 1fr;
  gap: 10px;
  padding: 10px 0;

  &::after {
    content: "";
    position: absolute;
    left: calc(var(--rail) / 2);
    transform: translateX(-50%);

    top: calc(var(--dot) / 0.6 + var(--line-gap) - var(--line-extend));
    height: calc(100% - var(--dot) - var(--line-gap) + var(--line-extend) * 2);

    width: 2px;
    background: ${(p) => (p.$lineActive ? "#f5b300" : "rgba(255,255,255,.18)")};
    border-radius: 2px;
    display: ${(p) => (p.$isLast ? "none" : "block")};
  }
`;

const Dot = styled.span`
  width: var(--dot);
  height: var(--dot);
  margin-left: calc((var(--rail) - var(--dot)) / 2);
  margin-top: var(--yshift); /* ← опускаем точку */
  border-radius: 50%;
  border: 2px solid ${(p) => (p.$active ? YELLOW : LINE_INACTIVE)};
  background: ${(p) => (p.$active ? YELLOW : "transparent")};
  box-shadow: ${(p) => (p.$active ? "0 0 0 3px rgba(245,179,0,.15)" : "none")};
`;
