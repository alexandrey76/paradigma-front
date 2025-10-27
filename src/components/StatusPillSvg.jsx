import React from "react";

const PUB = process.env.PUBLIC_URL || "";


const FILE_BY_STATUS = {
  pending: "created.svg", 
  created: "created.svg", 
  confirmed: "confirmed.svg",
  processing: "processing.svg",
  shipped: "shipped.svg",
  ready_for_pickup: "ready_for_pickup.svg",
  completed: "completed.svg",
  rejected: "rejected.svg",
};


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

export default function StatusPillSvg({ status, width = 100, style, className }) {
  const key = String(status || "").toLowerCase();
  const file = FILE_BY_STATUS[key] || FILE_BY_STATUS.pending;
  const label = LABEL_BY_STATUS[key] || "Статус";

  const src = `${PUB}/assets/status/${file}`;

  const imgStyle = { display: "inline-block", height: "auto", width, ...style };

  return <img src={src} alt={label} title={label} style={imgStyle} className={className} />;
}
