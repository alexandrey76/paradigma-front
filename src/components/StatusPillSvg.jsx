// src/components/StatusPillSvg.jsx
import styled from "styled-components";

const PUB = process.env.PUBLIC_URL || "";

// Маппинг статуса -> имя svg-файла в /assets/status
const ICON_BY_STATUS = {
  pending: "created",            // ожидание = created.svg
  confirmed: "confirmed",
  processing: "processing",
  shipped: "shipped",
  ready_for_pickup: "ready_for_pickup",
  completed: "completed",
  rejected: "rejected",
};

// Человекочитаемое название статусов (если захочешь выводить текст)
const LABEL_BY_STATUS = {
  pending: "Ожидает",
  confirmed: "Подтверждена",
  processing: "В обработке",
  shipped: "В доставке",
  ready_for_pickup: "Готов к получению",
  completed: "Выполнена",
  rejected: "Отклонена",
};

/**
 * Рендерит «пилюлю» статуса: иконка (svg) + опционально подпись.
 *
 * Props:
 *  - status: string (обяз.) — одно из:
 *      pending | confirmed | processing | shipped | ready_for_pickup | completed | rejected
 *  - showText?: boolean (по умолчанию true) — показывать ли текст рядом с иконкой
 *  - size?: number (px, по умолчанию 20) — размер иконки
 */
export default function StatusPillSvg({ status, showText = true, size = 20 }) {
  const key = String(status || "").toLowerCase();
  const iconName = ICON_BY_STATUS[key] || "created";
  const label = LABEL_BY_STATUS[key] || "Статус";

  const src = `${PUB}/assets/status/${iconName}.svg`;

  return (
    <Wrap aria-label={label} title={label}>
      <Icon src={src} alt={label} $size={size} />
      {showText && <Label>{label}</Label>}
    </Wrap>
  );
}

const Wrap = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1.5px solid #fff;
  border-radius: 999px;
  background: #0b0b0b;
`;

const Icon = styled.img`
  width: ${(p) => p.$size}px;
  height: ${(p) => p.$size}px;
  display: block;
`;

const Label = styled.span`
  font-size: 13px;
  line-height: 1;
`;