// src/pages/CatalogPage.jsx
import React, { useCallback } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

import products from "../data/products";
import { useCart } from "../context/CartContext";
import TopBar from "../components/TopBar";

const PUB = process.env.PUBLIC_URL || "";

export default function CatalogPage() {
  const { addItem, getItemQuantity } = useCart();

  const getQty = useCallback((id) => getItemQuantity(id), [getItemQuantity]);

  const getIcon = (qty) =>
    qty > 0
      ? `${PUB}/assets/images/productCartActive.svg`
      : `${PUB}/assets/images/productCart.svg`;

  const onAdd = async (product) => {
    try {
      await addItem(product, 1);
    } catch (e) {
      console.error("Failed to add to cart:", e);
      alert(`Не удалось добавить в корзину: ${e.message || e}`);
    }
  };

  return (
    <PageWrapper>
      <TopBar title="Каталог товаров" hideBack />

      <Grid>
        {products.map((p) => {
          const qty = getQty(p.id);
          const icon = getIcon(qty);

          const hasOld = typeof p.oldPrice === "number" && p.oldPrice > 0;

          // Логика наличия:
          // считаем, что товара нет, если inStock === false ИЛИ stock === 0
          const outOfStock =
            p?.inStock === false || (typeof p?.stock === "number" && p.stock <= 0);

          return (
            <Card key={p.id}>
              <Link to={`/product/${p.id}`}>
                <ProductImage
                  src={p.images?.[0] || `${PUB}/assets/images/placeholder.png`}
                  alt={p.name}
                  loading="lazy"
                />
              </Link>

              <InfoRow>
                <PriceBlock>
                  <PriceRow>
                    <PriceNow $hasOld={hasOld}>
                      {(p.price ?? 0).toLocaleString("ru-RU")} ₽
                    </PriceNow>
                    {hasOld && (
                      <PriceOld>{p.oldPrice.toLocaleString("ru-RU")} ₽</PriceOld>
                    )}
                  </PriceRow>
                  <Name>{p.name}</Name>
                </PriceBlock>

                {outOfStock ? (
                  <StockBadge>Нет в наличии</StockBadge>
                ) : (
                  <CartBtnWrap
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdd(p);
                    }}
                    aria-label={qty > 0 ? `В корзине: ${qty}` : "В корзину"}
                  >
                    <img src={icon} alt="" />
                    {qty > 0 && <CartBadge>{qty > 9 ? "9+" : qty}</CartBadge>}
                  </CartBtnWrap>
                )}
              </InfoRow>
            </Card>
          );
        })}
      </Grid>
    </PageWrapper>
  );
}

/* ===================== styled ===================== */

const PageWrapper = styled.div`
  background: #000;
  min-height: 100vh;
  color: #fff;
  padding: 12px var(--side-pad, 16px) 16px;
  font-family: "Montserrat", system-ui, -apple-system, Segoe UI, Roboto, Arial,
    sans-serif;
`;

const Grid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, 1fr);
`;

const Card = styled.div`
  background: transparent;
  border-radius: 8px;
  overflow: visible; /* чтобы бейджик не резался */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const ProductImage = styled.img`
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border: 2px solid #ffffff;
  border-radius: 6px;
  display: block;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 8px;
  gap: 8px;

  /* чуть смещаем текст вправо, чтобы он визуально не выходил за рамку фото */
  padding: 0 2px 0 4px;
`;

const PriceBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1 1 auto;
  min-width: 0;
`;

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
`;

const PriceNow = styled.span`
  font-weight: 800;
  font-size: 14px;
  white-space: nowrap;
  color: ${(p) => (p.$hasOld ? "#ca3b34" : "#ffffff")};
`;

const PriceOld = styled.span`
  font-size: 11px;
  color: #a0a0a0;
  text-decoration: line-through;
  opacity: 0.9;
  white-space: nowrap;
`;

const Name = styled.div`
  font-size: 14px;
  color: #ccc;
  --lh: 1.2;
  line-height: var(--lh);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  min-height: calc(2 * var(--lh) * 1em);
`;

const CartBtnWrap = styled.button`
  --icon-size: 40px;
  position: relative;
  background: transparent;
  border: none;
  padding: 0;
  display: inline-grid;
  place-items: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  img {
    width: var(--icon-size);
    height: var(--icon-size);
    display: block;
    object-fit: contain;
  }
`;

const CartBadge = styled.span`
  position: absolute;
  top: -6px;
  right: -6px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #f5b300;
  border: 2px solid #fff;
  font-size: 9px;
  font-weight: 800;
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  pointer-events: none;
`;

const StockBadge = styled.div`
  border: 2px solid #ff5252;
  color: #ff5252;
  background: transparent;
  border-radius: 10px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  user-select: none;
`;

