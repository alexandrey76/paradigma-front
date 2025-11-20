import React, { useMemo, useEffect, useState } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
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
  confirmed: "Подтвержден",
  processing: "В обработке",
  shipped: "Заказ передан в доставку",
  ready_for_pickup: "Заказ готов к получению",
  completed: "Выполнен",
  rejected: "Отменен",
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

// статусы, при которых клиент может отменить заказ (только pending и processing)
const CAN_USER_CANCEL = new Set(["pending", "processing"]);

export default function OrderDetailsPage() {
  const { id } = useParams();
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
        throw new Error(
          res.status === 404 ? "Заказ не найден" : `HTTP ${res.status}`
        );
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
      rows.sort(
        (a, b) =>
          new Date(a.changed_at).getTime() -
          new Date(b.changed_at).getTime()
      );
      setTimeline(rows);
    } catch (e) {
      console.warn("timeline fetch error", e);
      setTimeline([]);
    }
  }

  const getProductImage = (productId) => IMAGE_MAP[productId] || null;

  // приводим заказ из БД к удобному виду и используем только БДшные суммы
  const transformedOrder = useMemo(() => {
    if (!order) return null;

    let itemsRaw;
    try {
      itemsRaw =
        typeof order.items_json === "string"
          ? JSON.parse(order.items_json)
          : order.items_json || [];
    } catch {
      itemsRaw = [];
    }

    const items = itemsRaw.map((i) => {
      const price = Number(i.price) || 0;
      const qty = Number(i.qty) || 0;
      // line_total сохраняем при создании заказа на бэке
      const lineTotalRaw = i.line_total ?? i.total ?? i.sum ?? NaN;
      const lineTotal = Number.isFinite(Number(lineTotalRaw))
        ? Number(lineTotalRaw)
        : price * qty;

      return {
        id: i.id,
        name: i.name,
        price,
        qty,
        lineTotal,
        image: getProductImage(i.id),
      };
    });

    // total_from_db / total — из БД
    const dbTotal = Number(order.total_from_db ?? order.total ?? NaN);
    const fallbackTotal = items.reduce((s, it) => s + it.lineTotal, 0);
    const total = Number.isFinite(dbTotal) ? dbTotal : fallbackTotal;

    return {
      id: order.order_uid,
      created_at: order.created_at,
      total,
      status: order.status || "pending",
      items,
    };
  }, [order]);

  // карта «статус → время наступления»
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

  const hasRejected = "rejected" in reachedAt;

  const stepsForRender = useMemo(
    () =>
      hasRejected
        ? ["rejected", ...BASE_STEPS.filter((s) => s !== "pending")]
        : BASE_STEPS,
    [hasRejected]
  );

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
        out[key] = lastRealTime;
      }
    });

    return out;
  }, [hasRejected, stepsForRender, reachedAt, furthestReachedIndex, transformedOrder]);

  // ===== отмена заказа пользователем =====
  const allowCancel = useMemo(() => {
    const st = String(transformedOrder?.status || "").toLowerCase();
    return !hasRejected && CAN_USER_CANCEL.has(st);
  }, [transformedOrder, hasRejected]);

  const tgPopup = (title, message) => {
    const tg = window?.Telegram?.WebApp;
    if (tg?.showPopup) {
      return new Promise((res) =>
        tg.showPopup(
          {
            title,
            message,
            buttons: [
              { id: "ok", type: "ok" },
              { id: "cancel", type: "cancel" },
            ],
          },
          (btnId) => res(btnId === "ok")
        )
      );
    }
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  };

  const tgAlert = (message) => {
    const tg = window?.Telegram?.WebApp;
    if (tg?.showAlert) tg.showAlert(message);
    else alert(message);
  };

  async function cancelOrder() {
    const ok = await tgPopup("Отменить заказ", "Вы уверены, что хотите отменить заказ?");
    if (!ok) return;
    try {
      const tg = window?.Telegram?.WebApp;
      const initData = tg?.initData || "";

      const res = await fetch(`${API_BASE}/api/orders/${id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": initData || "",
        },
        body: JSON.stringify({ reason: "user_cancelled" }),
      });

      if (!res.ok) {
        // тихо выходим — кнопка сама пропадёт, когда статус станет неподходящим
        return;
      }

      tgAlert("Заказ отменён.");
      await Promise.all([fetchOrder(), fetchTimeline()]);
    } catch {
      // тихий фолбэк без алертов
    }
  }

  // ======= рендер =======
  if (loading) {
    return (
      <Page>
        <TopBar title="Заказ" />
        <Empty>Загружаем…</Empty>
      </Page>
    );
  }

  if (error || !transformedOrder) {
    return (
      <Page>
        <TopBar title="Заказ" />
        <Empty>{error || "Заказ не найден"}</Empty>
      </Page>
    );
  }

  return (
    <Page>
      <TopBar title="Заказ" />

      <Section>
        <Row>
          <LeftMuted>Заказ №</LeftMuted>
          <RightStrong>{transformedOrder.id}</RightStrong>
        </Row>
        <Divider />
        <Row>
          <LeftMuted>Дата создания:</LeftMuted>
          <RightStrong>
            {formatDateLocal(transformedOrder.created_at)}
          </RightStrong>
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
                  <div className="time">
                    {formatDateTimeLocal(displayTimeByStep[key])}
                  </div>
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
                <span>{formatRUB(it.lineTotal)}</span>
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

      {allowCancel && (
        <Actions>
          <CancelBtn type="button" onClick={cancelOrder}>
            Отменить заказ
          </CancelBtn>
        </Actions>
      )}

      <BottomPad />
    </Page>
  );
}

/* =================== styled и utils =================== */

const Page = styled.main`
  min-height: 100dvh;
  background: #000;
  color: #fff;
  padding: 12px var(--side-pad, 16px) 24px;
  font-family: "Montserrat", system-ui, -apple-system, Segoe UI, Roboto,
    sans-serif;
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

const Actions = styled.div`
  margin-top: 6px;
`;

const CancelBtn = styled.button`
  width: 100%;
  height: 44px;
  border-radius: 10px;
  border: 2px solid #ff5252;
  background: #ff5252;
  color: #000;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  &:active { transform: translateY(1px); }
`;

const BottomPad = styled.div`
  height: 80px;
`;

function formatDateLocal(iso) {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
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
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
    const tm = new Intl.DateTimeFormat("ru-RU", {
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
