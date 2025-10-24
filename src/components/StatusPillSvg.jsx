import React from "react";

const PUB = process.env.PUBLIC_URL || "";

// маппинг статуса -> имя файла из /assets/status
const FILE_BY_STATUS = {
  pending: "created.svg",          // ожидание = created
  created: "created.svg",          // legacy
  confirmed: "confirmed.svg",
  processing: "processing.svg",
  shipped: "shipped.svg",
  ready_for_pickup: "ready_for_pickup.svg",
  completed: "completed.svg",
  rejected: "rejected.svg",
};

// человекочитаемые подписи (для alt/title)
const LABEL_BY_STATUS = {
  pending: "Создана",
  created: "Создана",
  confirmed: "Подтверждена",
  processing: "В обработке",
  shipped: "Заказ передан в доставку",
  ready_for_pickup: "Заказ готов к получению",
  completed: "Выполнена",
  rejected: "Отменена",
};

/**
 * Показывает ТОЛЬКО svg-иконку статуса (как в макете).
 *
 * Props:
 *  - status: string (обяз.)
 *  - height?: number | string = 32  (можешь менять под нужный размер)
 *  - style?: React.CSSProperties    (если нужно тонко подправить)
 *  - className?: string
 */
export default function StatusPillSvg({ status, width = 32, style, className }) {
  const key = String(status || "").toLowerCase();
  const file = FILE_BY_STATUS[key] || FILE_BY_STATUS.pending;
  const label = LABEL_BY_STATUS[key] || "Статус";

  const src = `${PUB}/assets/status/${file}`;

  // важное: оставляем ширину авто, чтобы svg масштабировался пропорционально высоте
  const imgStyle = { display: "inline-block", height: "auto", width, ...style };

  return <img src={src} alt={label} title={label} style={imgStyle} className={className} />;
}
