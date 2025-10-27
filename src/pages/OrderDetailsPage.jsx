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

// Человекочитаемые подписи статусов
const STATUS_LABEL = {
  pending: "Ожидает подтверждения",
  confirmed: "Подтверждена",
  processing: "Обработана",
  shipped: "Товар передан в доставку",
  ready_for_pickup: "Товар готов к получению",
  completed: "Выполнена",
  rejected: "Отменена",
};

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]); // <- реальная история из БД
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrderDetails();
    fetchTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const tg = window.Telegram?.WebApp;
      const initData = tg?.initData || "";

      const response = await fetch(`${API_BASE}/api/orders/${id}`, {
        method: "GET",
        headers: {
          "X-Telegram-Init-Data": initData,
        },
      });

      if (!response.ok) {
        if (response.status === 404) throw new Error("Заявка не найдена");
        throw new Error(`Ошибка загрузки: HTTP ${response.status}`);
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/orders/${id}/timeline`);
      const data = await resp.json();
      let rows = Array.isArray(data?.timeline) ? data.timeline : [];

      // Сортировка: новое сверху (чтобы "Отменена" была над "Ожидает...")
      rows.sort(
        (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
      );

      // Если есть rejected — это финальное состояние, просто показываем всю историю (отменённая будет сверху)
      setTimeline(rows);
    } catch (e) {
      console.warn("timeline fetch error", e);
      setTimeline([]);
    }
  };

  const getProductImage = (productId) => IMAGE_MAP[productId] || null;

  const transformedOrder = useMemo(() => {
    if (!order) return null;

    try {
      const items =
        typeof order.items_json === "string"
          ? JSON.parse(order.items_json)
          : order.items_json || [];

      return {
        id: order.order_uid,
        created_at: order.created_at,
        total: order.total,
        delivery: 0,
        discount: 0,
        status: order.status || "pending",
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
          image: getProductImage(item.id),
        })),
      };
    } catch (e) {
      console.error("Error transforming order:", e);
      return {
        id: order.order_uid,
        created_at: order.created_at,
        total: order.total,
        delivery: 0,
        discount: 0,
        status: order.status || "pending",
        items: [],
      };
    }
  }, [order]);

  if (loading) {
    return (
      <Page>
        <TopBar title="Заявка" onBack={() => navigate(-1)} />
        <Empty>Загружаем...</Empty>
      </Page>
    );
  }

  if (error || !transformedOrder) {
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
          <RightStrong>{formatDate(transformedOrder.created_at)}</RightStrong>
        </Row>
      </Section>

      <SectionHeader>Статус заявки:</SectionHeader>
      <Hairline />

      <Timeline>
        {timeline.length === 0 ? (
          <li>
            <span className="dot" />
            <div className="text">
              <div className="label">{STATUS_LABEL.pending}</div>
              <div className="time">{formatDateTime(new Date(order.created_at))}</div>
            </div>
          </li>
        ) : (
          timeline.map((row, i) => {
            const label =
              STATUS_LABEL[String(row.to_status).toLowerCase()] || "Статус";
            return (
              <li key={`${row.changed_at}-${i}`} className="reached">
                <span className="dot" />
                <div className="text">
                  <div className="label">{label}</div>
                  <div className="time">{formatDateTime(row.changed_at)}</div>
                </div>
              </li>
            );
          })
        )}
      </Timeline>

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
        <SumRow>
          <span>Доставка:</span>
          <b>
            {transformedOrder.delivery
              ? formatRUB(transformedOrder.delivery)
              : "Бесплатно"}
          </b>
        </SumRow>

        <TotalRow>
          Итого:{" "}
          <b>
            {formatRUB(
              transformedOrder.total -
                (transformedOrder.discount || 0) +
                (transformedOrder.delivery || 0)
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
function formatDateTime(isoOrDate) {
  try {
    const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
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
