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

// Человекочитаемые подписи
const LABEL = {
  pending: "Ожидает подтверждения",
  confirmed: "Подтверждена",
  processing: "В обработке",
  shipped: "Заказ передан в доставку",
  ready_for_pickup: "Заказ готов к получению",
  completed: "Выполнена",
  rejected: "Отменена",
};

// Базовая дорожка без "rejected"
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
  const [timeline, setTimeline] = useState([]); // [{from_status,to_status,changed_at,manager_username}, ...]
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
        throw new Error(res.status === 404 ? "Заказ не найден" : `HTTP ${res.status}`);
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
      // старые → новые
      rows.sort(
        (a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
      );
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

  // карта «статус → время наступления» из реального таймлайна
  const reachedAt = useMemo(() => {
    const map = {};
    for (const row of timeline) {
      const k = String(row.to_status || "").toLowerCase();
      if (!map[k]) map[k] = row.changed_at; // фиксируем первое наступление
    }
    // создание заказа трактуем как pending на момент created_at
    if (transformedOrder?.created_at && !map.pending) {
      map.pending = transformedOrder.created_at;
    }
    return map;
  }, [timeline, transformedOrder]);

  const hasRejected = "rejected" in reachedAt;

  // Итоговая дорожка (если отмена — без "pending" после "rejected")
  const stepsForRender = useMemo(() => {
    return hasRejected
      ? ["rejected", ...BASE_STEPS.filter((s) => s !== "pending")]
      : BASE_STEPS;
  }, [hasRejected]);

  // Посчитать индекс «самого дальнего» достигнутого шага.
  const furthestReachedIndex = useMemo(() => {
    if (!transformedOrder) return 0;
    if (hasRejected) return 0;

    const statusIdx = stepsForRender.indexOf(transformedOrder.status);
    let maxIdxByHistory = -1;
    stepsForRender.forEach((key, idx) => {
      if (reachedAt[key]) maxIdxByHistory = Math.max(maxIdxByHistory, idx);
    });
    const candidate = Math.max(statusIdx, maxIdxByHistory);
    return Math.max(0, candidate);
  }, [hasRejected, stepsForRender, transformedOrder, reachedAt]);

  // Время для отображения (в локальной TZ пользователя)
  const displayTimeByStep = useMemo(() => {
    const out = {};
    if (!transformedOrder) return out;

    if (hasRejected) {
      if (reachedAt.rejected) out.rejected = reachedAt.rejected;
      return out;
    }

    let lastRealTime = transformedOrder.created_at || null;

    stepsForRender.forEach((key, idx) => {
      if (reachedAt[key]) {
        lastRealTime = reachedAt[key];
        out[key] = reachedAt[key];
      } else if (idx <= furthestReachedIndex) {
        out[key] = lastRealTime; // «наследуем» время
      }
    });

    return out;
  }, [hasRejected, stepsForRender, reachedAt, furthestReachedIndex, transformedOrder]);

  if (loading) {
    return (
      <Page>
        <TopBar title="Заказ" onBack={() => navigate(-1)} />
        <Empty>Загружаем…</Empty>
      </Page>
    );
  }

  if (error || !transformedOrder) {
    return (
      <Page>
        <TopBar title="Заказ" onBack={() => navigate(-1)} />
        <Empty>{error || "Заказ не найден"}</Empty>
      </Page>
    );
  }

  return (
    <Page>
      <TopBar title="Заказ" onBack={() => navigate(-1)} />

      <Section>
        <Row>
          <LeftMuted>Заказ №</LeftMuted>
          <RightStrong>{transformedOrder.id}</RightStrong>
        </Row>
        <Divider />
        <Row>
          <LeftMuted>Дата создания:</LeftMuted>
          <RightStrong>{formatDateLocal(transformedOrder.created_at)}</RightStrong>
        </Row>
      </Section>

      <SectionHeader>Статус заказа:</SectionHeader>
      <Hairline />

      <TimelineUI>
        {stepsForRender.map((key, i) => {
          const label = LABEL[key] || "Статус";
          const reached = hasRejected ? i === 0 : i <= furthestReachedIndex;
          const showTime = Boolean(displayTimeByStep[key]);
          return (
            <li key={key} className={reached ? "reached" : ""} data-state={key}>
              <span className="dot" />
              <div className="text">
                <div className="label">{label}</div>
                {showTime && (
                  <div className="time">{formatDateTimeLocal(displayTimeByStep[key])}</div>
                )}
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

/* =================== styled =================== */

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

  /* активные точки и линия */
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

  /* красная точка для отмены */
  li[data-state="rejected"].reached .dot {
    border-color: #ff5252;
    background: #ff5252;
  }
  li[data-state="rejected"].reached::before {
    background: #ff5252;
  }
  li[data-state="rejected"].reached:last-child::before {
    background: linear-gradient(to bottom, #ff5252 0 50%, transparent 50% 100%);
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

/* ===== utils: локальная TZ пользователя ===== */

const USER_TZ =
  Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;

function formatDateLocal(iso) {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      // timeZone: USER_TZ, // можно не указывать — по умолчанию локальная
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso ?? "";
  }
}

function formatDateTimeLocal(iso) {
  try {
    const d = new Date(iso);
    const dd = new Intl.DateTimeFormat("ru-RU", {
      // timeZone: USER_TZ,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
    const tm = new Intl.DateTimeFormat("ru-RU", {
      // timeZone: USER_TZ,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
    return `${dd} ${tm}`;
  } catch {
    return "";
  }
}

function formatRUB(v) {
  return `${Number(v).toLocaleString("ru-RU")} ₽`;
}