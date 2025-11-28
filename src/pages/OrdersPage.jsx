import { useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import StatusPillSvg from "../components/StatusPillSvg";
import products from "../data/products"; // <-- добавили

const API_BASE =
  process.env.REACT_APP_API_BASE ||
  "https://alexandrey76-paradigma-back-c956.twc1.net";

/* === изображения товаров (миниатюры) === */
// первая картинка из products.js по ID товара
const getProductImage = (productId) => {
  const prod = products.find(
    (p) => Number(p.id) === Number(productId)
  );
  return prod?.images?.[0] || null;
};

const STATUS_TEXT = {
  pending: "Ожидает подтверждения",
  confirmed: "Подтверждена",
  rejected: "Отклонена",
  created: "Создана",
  processing: "Обработана",
  ready_to_ship: "Товар готов к отправке",
  ready_for_pickup: "Товар готов к получению",
  done: "Выполнена",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserOrders();
  }, []);

  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const tg = window.Telegram?.WebApp;
      const u = tg?.initDataUnsafe?.user;
      const initData = tg?.initData || "";
      const uid = u?.id;

      if (!uid) {
        setError("Не удалось определить пользователя");
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/orders/my-orders?tg_user_id=${uid}`,
        {
          method: "GET",
          headers: {
            "X-Telegram-Init-Data": initData || "",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Не удалось загрузить заказы");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const transformOrder = (order) => {
    try {
      const rawItems =
        typeof order.items_json === "string"
          ? JSON.parse(order.items_json)
          : order.items_json || [];

      const items = rawItems.map((item) => {
        const price = Number(item.price) || 0;
        const qty = Number(item.qty) || 0;
        return {
          id: item.id,
          name: item.name,
          price,
          qty,
          image: getProductImage(item.id), // <-- берём картинку по products.js
        };
      });

      // итоговая сумма – ТОЛЬКО из БД, если она есть
      const dbTotal = Number(
        order.total_from_db ?? order.total ?? NaN
      );
      const fallbackTotal = items.reduce(
        (s, it) => s + it.price * it.qty,
        0
      );
      const total = Number.isFinite(dbTotal) ? dbTotal : fallbackTotal;

      return {
        id: order.order_uid,
        created_at: order.created_at,
        total,
        status: order.status || "pending",
        items,
      };
    } catch (e) {
      console.error("Error transforming order:", e);
      return {
        id: order.order_uid,
        created_at: order.created_at,
        total: Number(order.total) || 0,
        status: order.status || "pending",
        items: [],
      };
    }
  };

  const handleProductClick = (e, productId) => {
    e.stopPropagation();
    navigate(`/product/${productId}`);
  };

  const handleOrderClick = (orderId) => {
    navigate(`/order/${orderId}`);
  };

  const handleSeeButtonClick = (e, orderId) => {
    e.stopPropagation();
    navigate(`/order/${orderId}`);
  };

  const transformedOrders = orders.map(transformOrder);

  return (
    <Page>
      <TopBar title="Отправленные заказы" />

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {loading ? (
        <Empty>Загружаем…</Empty>
      ) : !transformedOrders.length ? (
        <Empty>Заказов пока нет</Empty>
      ) : (
        <List>
          {transformedOrders.map((o) => {
            const thumbs = Array.from({ length: 4 }, (_, i) => {
              const item = o.items[i];
              return item ? { src: item.image, productId: item.id } : null;
            });

            return (
              <Card key={o.id} onClick={() => handleOrderClick(o.id)}>
                <ThumbsRow>
                  {thumbs.map((thumb, idx) => (
                    <Thumb key={idx}>
                      {thumb ? (
                        <img
                          src={thumb.src}
                          alt=""
                          onClick={(e) =>
                            handleProductClick(e, thumb.productId)
                          }
                        />
                      ) : null}
                    </Thumb>
                  ))}
                </ThumbsRow>

                <InfoGrid>
                  <div>
                    <FieldLabel>Заказ №</FieldLabel>
                    <FieldValue>{o.id}</FieldValue>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <FieldLabel>Цена</FieldLabel>
                    <Price>{formatRUB(o.total)}</Price>
                  </div>
                </InfoGrid>

                <div>
                  <FieldLabel>Статус</FieldLabel>
                  <StatusPillSvg status={o.status} size={10} />
                </div>

                <SeeBtn
                  type="button"
                  onClick={(e) => handleSeeButtonClick(e, o.id)}
                >
                  Посмотреть
                </SeeBtn>
              </Card>
            );
          })}
        </List>
      )}
    </Page>
  );
}

/* =================== styled =================== */

const Page = styled.main`
  min-height: 100dvh;
  background: #000;
  color: #fff;
  padding: 12px var(--side-pad, 16px) 24px;
`;

const Empty = styled.div`
  min-height: 60vh;
  display: grid;
  place-items: center;
  color: #d6d6d6;
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  text-align: center;
  margin: 20px 0;
  padding: 10px;
  border: 1px solid #ff6b6b;
  border-radius: 8px;
`;

const List = styled.div`
  display: grid;
  gap: 14px;
`;

const Card = styled.div`
  background: #0b0b0b;
  border: 1.5px solid #fff;
  border-radius: 12px;
  padding: 14px;
  display: grid;
  gap: 12px;
  cursor: pointer;

  &:hover {
    background: #1a1a1a;
  }
`;

const ThumbsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
`;

const Thumb = styled.div`
  aspect-ratio: 1 / 1;
  border: 1.5px solid #fff;
  border-radius: 10px;
  overflow: hidden;
  background: transparent;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: start;
`;

const FieldLabel = styled.div`
  color: #bdbdbd;
  font-size: 12px;
  margin-bottom: 4px;
`;

const FieldValue = styled.div`
  font-weight: 700;
  font-size: 14px;
  word-break: break-all;
`;

const Price = styled.div`
  font-weight: 900;
  font-size: clamp(16px, 4vw, 18px);
`;

const SeeBtn = styled.button`
  margin-top: 2px;
  height: 44px;
  width: 100%;
  border-radius: 10px;
  border: 2px solid #fff;
  background: #fff;
  color: #000;
  font-weight: 550;
  font-size: clamp(14px, 3.6vw, 16px);
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  padding: 0 14px;
  cursor: pointer;
  transition: transform 120ms ease-out, box-shadow 120ms ease-out;
  transform: ${(p) => (p.$pressed ? "scale(.965)" : "scale(1)")};
  &:active {
    transform: translateY(1px);
  }

  &:hover {
    background: #f0f0f0;
  }
`;

/* utils */
function formatRUB(v) {
  return Number(v).toLocaleString("ru-RU") + " ₽";
}
