// src/components/StatusPillSvg.jsx
import React from "react";

const PUB = process.env.PUBLIC_URL || "";

// статус -> имя svg-файла в /assets/status
const ICON_BY_STATUS = {
  pending: "pending",
  created: "created",              // legacy: трактуем как pending
  confirmed: "confirmed",
  processing: "processing",
  shipped: "shipped",
  ready_for_pickup: "ready_for_pickup",
  completed: "completed",
  rejected: "rejected",
};

/**
 * Показывает ТОЛЬКО SVG-иконку статуса.
 *
 * Props:
 *  - status: string (обяз.) — один из:
 *      pending | created | confirmed | processing | shipped | ready_for_pickup | completed | rejected
 *  - size?: number (px) — размер стороны иконки, по умолчанию 20
 *  - title?: string — всплывающая подсказка при наведении (опционально)
 */
export default function StatusPillSvg({ status, size = 20, title }) {
  const key = String(status || "").toLowerCase();
  const iconName = ICON_BY_STATUS[key] || "created";
  const src = `${PUB}/assets/status/${iconName}.svg`;

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      title={title}
      style={{ display: "inline-block", verticalAlign: "middle" }}
    />
  );
}
