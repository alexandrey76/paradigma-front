import styled from "styled-components";

const ICONS = {
  created: "/assets/status/created.svg",
  processing: "/assets/status/processing.svg",
  done: "/assets/status/done.svg",
  ready_to_ship: "/assets/status/ready_to_ship.svg",
  ready_for_pickup: "/assets/status/ready_for_pickup.svg",
};

export default function StatusPillSvg({ status }) {
  const src = ICONS[status] || ICONS.created;
  const isBig = status === "ready_to_ship" || status === "ready_for_pickup";

  return <Pill $src={src} $big={isBig} aria-label={status} />;
}

/* компакт: одинаковая ширина, две высоты по статусу */
const Pill = styled.div`
  width: 160px;                          /* одинаковая ширина для всех */
  height: ${(p) => (p.$big ? 36 : 28)}px;/* big: ready_*  | small: остальные */
  background-image: url(${(p) => p.$src});
  background-size: contain;
  background-repeat: no-repeat;
  background-position: left center;

  display: block;
  margin-top: 6px;

  /* фиксируем «уезд вправо» в любых контейнерах */
  justify-self: start;
  align-self: start;
`;
