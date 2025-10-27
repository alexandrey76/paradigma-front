// src/pages/OrderDetailsPage.jsx
import React, { useMemo, useEffect, useState } from "react";
import styled from "styled-components";
import { useParams, useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";

const API_BASE =
  process.env.REACT_APP_API_BASE ||
  "https://alexandrey76-paradigma-back-c956.twc1.net";

/* === изображения товаров (детали) === */
const PUB = process.env.PUBLIC_URL || "";
const P = `${PUB}/assets/products_images`;
const IMAGE_MAP = {
  1: `${P}/paradigmaone.jpg`,
  2: `${P}/paradigmalukah.jpg`,
  3: `${P}/paradigmaneo.jpg`,
  4: `${P}/paradigmaportative.jpg`,
};

const LABEL = {
  pending: "Ожидает подтверждения",
  confirmed: "Подтверждена",
  processing: "Обработана",
  shipped: "Товар передан в доставку",
  ready_for_pickup: "Товар готов к получению",
  completed: "Выполнена",
  rejected: "Отменена",
};

const BASE_STEPS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "ready_for_pickup",
  "completed",
];

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrder();
    fetchTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchOrder() {
    try {
      setLoading(true);
      setError("");
      const tg = window.Telegram?.WebApp;
      const initData = tg?.initData || "";

      const res = await fetch(`${API_BASE}/api/orders/${id}`, {
        headers: { "X-Telegram-Init-Data": initData || "" },
      });
      if (!res.ok) {
        throw new Error(res.status === 404 ? "Заявка не найдена" : `HTTP ${res.status}`);
      }
      const data = await res.json();
      setOrder(data.order);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function fetchTimeline() {
    try {
      const res = await fetch(`${API_BASE}/api/orders/${id}/timeline`);
      const data = await res.json();
      let rows = Array.isArray(data?.timeline) ? data.timeline : [];
      rows.sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));
      setTimeline(rows);
    } catch (e) {
      console.warn("timeline fetch error", e);
      setTimeline([]);
    }
  }

  const getProductImage = (productId) => IMAGE_MAP[productId] || null;

  const transformedOrder = useMemo(() => {
    if (!order) return null;

    let items;
    try {
      items =
        typeof order.items_json === "string"
          ? JSON.parse(order.items_json)
          : order.items_json || [];
    } catch {
      items = [];
    }

    return {
      id: order.order_uid,
      created_at: order.created_at,
      total: order.total,
      status: order.status || "pending",
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        qty: i.qty,
        image: getProductImage(i.id),
      })),
    };
  }, [order]);

  // статус -> время первого наступления
  const reachedAt = useMemo(() => {
    const map = {};
    for (const row of timeline) {
      const k = String(row.to_status || "").toLowerCase();
      if (!map[k]) map[k] = row.changed_at;
    }
    if (transformedOrder?.created_at && !map.pending) {
      map.pending = transformedOrder.created_at;
    }
    return map;
  }, [timeline, transformedOrder]);

  const showRejectedFirst = "rejected" in reachedAt;
  const stepsForRender = showRejectedFirst ? ["rejected", ...BASE_STEPS] : BASE_STEPS;

  if (loading) {
    return (
      <Page>
        <TopBar title="Заявка" onBack={() => navigate(-1)} />
        <Empty>Загружаем…</Empty>
      </Page>
    );
  }

  if (!transformedOrder || error) {
    return (
      <Page>
        <TopBar title="Заявка" onBack={() => navigate(-1)} />
        <Empty>{error || "Заявка не найдена"}</Empty>
      </Page>
    );
  }

  return (
    <Page>
      <TopBar title="Заявка" onBack={() => navigate(-1)} />

      <Section>
        <Row>
          <LeftMuted>Заявка №</LeftMuted>
          <RightStrong>{transformedOrder.id}</RightStrong>
        </Row>
        <Divider />
        <Row>
          <LeftMuted>Дата создания:</LeftMuted>
          <RightStrong>{formatDateLocal(transformedOrder.created_at)}</RightStrong>
        </Row>
      </Section>

      <SectionHeader>Статус заявки:</SectionHeader>
      <Hairline />

      <TimelineUI>
        {stepsForRender.map((key) => {
          const label = LABEL[key] || "Статус";
          const time = reachedAt[key];
          const reached = Boolean(time);
          const isRejected = key === "rejected" && reached;

          return (
            <li
              key={key}
              className={`${reached ? "reached" : ""} ${isRejected ? "rejected" : ""}`}
            >
              <span className="dot" />
              <div className="text">
                <div className="label">{label}</div>
                {reached && <div className="time">{formatDateTimeLocal(time)}</div>}
              </div>
            </li>
          );
        })}
      </TimelineUI>

      <SectionHeader>Товары</SectionHeader>
      <Hairline />

      <Items>
        {transformedOrder.items.map((it, idx) => (
          <Item key={`${it.id}-${idx}`}>
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

            {idx !== transformedOrder.items.length - 1 && <AccentSeparator />}
          </Item>
        ))}
      </Items>

      <WhiteSeparator />

      <SummarySection>
        <SumRow>
          <span>Сумма товаров:</span>
          <b>{formatRUB(transformedOrder.total)}</b>
        </SumRow>
        <TotalRow>
          Итого: <b>{formatRUB(transformedOrder.total)}</b>
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

const TimelineUI = styled.ul`
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

  li::before {
    content: "";
    position: absolute;
    left: 11px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #2a2a2a;
  }

  li:first-child::before {
    top: 20px;
  }

  li:last-child::before {
    background: linear-gradient(to bottom, #2a2a2a 0 50%, transparent 50% 100%);
  }

  /* достигнутый статус — жёлтая линия/точка */
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

  /* REJECTED — красная точка и красная линия вниз до следующего шага */
  li.rejected .dot {
    border-color: #ff4545;
    background: #ff4545;
  }
  li.rejected::before {
    background: #ff4545;
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
    margin-left: 5px;
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

const AccentSeparator = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: #f5b300;
  border-radius: 2px;
`;

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
  height: 80px;
`;

/* ===== utils: локальная зона пользователя ===== */
function formatDateLocal(iso) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  } catch {
    return iso;
  }
}
function formatDateTimeLocal(iso) {
  try {
    const d = new Date(iso);
    const date = new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
    const time = new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
    return `${date} ${time}`;
  } catch {
    return "";
  }
}
function formatRUB(v) {
  return `${Number(v).toLocaleString("ru-RU")} руб`;
}
