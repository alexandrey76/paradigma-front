import React, { useMemo } from "react";
import styled from "styled-components";
import { useParams, useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";

/* ===== MOCK (замени на API) ===== */
const MOCK_BY_ID = {
  "9764c4s0y64vyushiu": {
    id: "9764c4s0y64vyushiu",
    created_at: "2025-11-04T12:12:00Z",
    total: 72657177,
    delivery: 0,
    discount: 0,
    status: "done",
    items: [
      {
        id: 1,
        name: "Электронный кальян Paradigma One",
        price: 18000,
        qty: 1,
        image: "/assets/images/product-1.jpg",
      },
      {
        id: 2,
        name: "Электронный кальян Paradigma x Lukah",
        price: 46000,
        qty: 1,
        image: "/assets/images/product-2.jpg",
      },
    ],
  },
};

const STEPS = [
  { key: "created",         label: "Создана" },
  { key: "processed",       label: "Обработана" },
  { key: "ready_to_ship",   label: "Товар готов к отправке" },
  { key: "ready_to_pickup", label: "Товар готов к получению" },
  { key: "done",            label: "Выполнена" },
];

/* ===== PAGE ===== */
export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const order = useMemo(() => MOCK_BY_ID[id] || null, [id]);

  const activeIndex = useMemo(() => {
    const idx = STEPS.findIndex((s) => s.key === order?.status);
    return idx < 0 ? 0 : idx;
  }, [order]);

  const getStepTime = (i) => {
    const base = new Date(order.created_at);
    const t = new Date(base.getTime() + i * 12 * 60 * 1000);
    return formatDateTime(t);
  };

  if (!order) {
    return (
      <Page>
        <TopBar title="Заявка" onBack={() => navigate(-1)} />
        <Empty>Заявка не найдена</Empty>
      </Page>
    );
  }

  return (
    <Page>
      <TopBar title="Заявка" onBack={() => navigate(-1)} />

      <Section>
        <Row>
          <LeftMuted>Заявка №</LeftMuted>
          <RightStrong>{order.id}</RightStrong>
        </Row>
        <Divider />
        <Row>
          <LeftMuted>Дата создания:</LeftMuted>
          <RightStrong>{formatDate(order.created_at)}</RightStrong>
        </Row>
      </Section>

      <SectionHeader>Статус заявки:</SectionHeader>
      <Hairline />

      <Timeline>
        {STEPS.map((s, i) => {
          const reached = i <= activeIndex;
          return (
            <li key={s.key} className={reached ? "reached" : ""}>
              <span className="dot" />
              <div className="text">
                <div className="label">{s.label}</div>
                {reached && <div className="time">{getStepTime(i)}</div>}
              </div>
            </li>
          );
        })}
      </Timeline>

      <SectionHeader>Товары</SectionHeader>
      <Hairline />

      <Items>
        {order.items.map((it, idx) => (
          <Item key={it.id}>
            <Pic>{it.image && <img src={it.image} alt="" />}</Pic>

            <Info>
              <Name>{it.name}</Name>

              <ThreeCols muted>
                <span>Цена</span>
                <span>Количество</span>
                <span>Итого</span>
              </ThreeCols>

              <ThreeCols strong>
                <span>{formatRUB(it.price)}</span>
                <span>{it.qty}</span>
                <span>{formatRUB(it.qty * it.price)}</span>
              </ThreeCols>
            </Info>

            {/* Жёлтая линия только между товарами */}
            {idx !== order.items.length - 1 && <AccentSeparator />}
          </Item>
        ))}
      </Items>

      {/* Белая линия перед блоком итогов */}
      <WhiteSeparator />

      <SummarySection>
        <SumRow>
          <span>Сумма товаров:</span>
          <b>{formatRUB(order.total)}</b>
        </SumRow>
        <SumRow>
          <span>Доставка:</span>
          <b>{order.delivery ? formatRUB(order.delivery) : "Бесплатно"}</b>
        </SumRow>

        <TotalRow>
          Итого:{" "}
          <b>
            {formatRUB(
              order.total - (order.discount || 0) + (order.delivery || 0)
            )}
          </b>
        </TotalRow>
      </SummarySection>

      <BottomPad />
    </Page>
  );
}

/* ===== styled ===== */

const Page = styled.main`
  min-height: 100dvh;
  background: #000;
  color: #fff;
  padding: 12px var(--side-pad, 16px) 24px;
  font-family: "Montserrat", system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
`;

const Empty = styled.div`
  min-height: 60vh;
  display: grid;
  place-items: center;
  color: #d6d6d6;
`;

const Section = styled.section`
  padding: 12px 0;
`;

const SectionHeader = styled.h3`
  margin: 14px 0 8px;
  font-size: 16px;
  font-weight: 800;
`;

const Hairline = styled.div`
  height: 2px;
  background: #1d1d1d;
  margin: 0 0 10px;
  border-radius: 2px;
`;

const Divider = styled.div`
  height: 1px;
  background: #1d1d1d;
  margin: 10px 0;
`;

const Row = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
`;

const LeftMuted = styled.span`
  color: #bdbdbd;
  font-size: 14px;
`;

const RightStrong = styled.span`
  font-weight: 800;
  font-size: 14px;
`;

/* ===== Таймлайн =====
   Фиксированная колонка 24px, центр линии = 12px,
   точка 14px -> отступ слева 5px (12 - 7) для идеального центра.
*/
const Timeline = styled.ul`
  list-style: none;
  margin: 0 0 8px 0;
  padding: 6px 0 0 0;

  li {
    position: relative;
    display: grid;
    grid-template-columns: 24px 1fr;
    align-items: center;
    min-height: 32px;
    padding: 6px 0;
  }

  /* Вертикальная линия по центру первой колонки */
  li::before {
    content: "";
    position: absolute;
    left: 11px; /* 12px центр - 1px половина ширины линии */
    top: 0;
    bottom: 0;
    width: 2px;
    background: #2a2a2a;
  }

  /* Убираем верхнюю часть линии над первой точкой */
  li:first-child::before {
    top: 20px; /* половина диаметра точки (14px / 2) */
  }

  /* У последнего шага линия уходит в прозрачность ниже точки */
  li:last-child::before {
    background: linear-gradient(to bottom, #2a2a2a 0 50%, transparent 50% 100%);
  }

  /* Пройденные шаги — жёлтые линия и точка */
  li.reached .dot {
    border-color: #f5b300;
    background: #f5b300;
  }
  li.reached::before {
    background: #f5b300;
  }
  li.reached:last-child::before {
    background: linear-gradient(to bottom, #f5b300 0 50%, transparent 50% 100%);
  }

  .dot {
    position: relative;
    z-index: 1;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid #8c8c8c;
    background: transparent;
    display: block;
    margin-left: 5px; /* 12 - 7 — центрируем в колонке */
  }

  .text .label {
    font-size: 15px;
    line-height: 1.2;
    font-weight: 700;
  }
  .text .time {
    margin-top: 2px;
    color: #bdbdbd;
    font-size: 11px;
  }
`;

/* ===== Товары ===== */
const Items = styled.div`
  margin-top: 6px;
`;

const Item = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 74px 1fr;
  gap: 12px;
  padding: 10px 0 14px;
`;

const Pic = styled.div`
  width: 74px;
  height: 74px;
  border-radius: 10px;
  border: 1.5px solid #ffffff;
  overflow: hidden;
  background: #111;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Info = styled.div``;

const Name = styled.div`
  font-weight: 800;
  margin: 2px 0 8px;
  font-size: 14px;
`;

const ThreeCols = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  font-size: 12px;
  color: ${(p) => (p.muted ? "#bdbdbd" : p.strong ? "#fff" : "#dcdcdc")};
  font-weight: ${(p) => (p.strong ? 800 : 500)};
  margin-bottom: ${(p) => (p.strong ? "0" : "4px")};
`;

/* Жёлтая линия между товарами */
const AccentSeparator = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: #f5b300;
  border-radius: 2px;
`;

/* Белая линия перед итогами */
const WhiteSeparator = styled.div`
  height: 2px;
  background: #ffffff;
  border-radius: 2px;
  margin: 4px 0 8px;
`;

const SummarySection = styled.section`
  padding: 8px 0 12px;
`;

const SumRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  color: #d6d6d6;
  font-size: 14px;
`;

const TotalRow = styled.div`
  margin-top: 8px;
  border-top: 2px solid #f5b300;
  padding-top: 10px;
  font-size: 16px;
  font-weight: 700;

  b {
    font-size: 18px;
    font-weight: 900;
  }
`;

const BottomPad = styled.div`
  height: 80px; /* под нижнюю навигацию */
`;

/* ===== utils ===== */
function pad(n) {
  return n < 10 ? `0${n}` : `${n}`;
}
function formatDate(iso) {
  try {
    const d = new Date(iso);
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  } catch {
    return iso;
  }
}
function formatDateTime(d) {
  try {
    const dd = pad(d.getDate());
    const mm = pad(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
  } catch {
    return "";
  }
}
function formatRUB(v) {
  return `${Number(v).toLocaleString("ru-RU")} руб`;
}
