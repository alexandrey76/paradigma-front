// src/pages/CatalogPage.jsx
import React, { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";

import products from "../data/products";
import { useCart } from "../context/CartContext";

const PUB = process.env.PUBLIC_URL || "";

/* ===================== page ===================== */

export default function CatalogPage() {
  const navigate = useNavigate();
  const { cart, addItem } = useCart();

  const getQty = useCallback(
    (id) => cart.find((x) => x.id === id)?.qty || 0,
    [cart]
  );

  const getIcon = (qty) =>
    qty > 0
      ? `${PUB}/assets/images/productCartActive.svg`
      : `${PUB}/assets/images/productCart.svg`;

  return (
    <PageWrapper>
      {/* 🔙 Заголовок с кнопкой назад */}
      <TopBar>
        <BackArrow onClick={() => navigate(-1)}>
          <img src={`${PUB}/assets/images/backArrow.svg`} alt="Назад" />
        </BackArrow>
        <span style={{ fontWeight: 800, color: "#000" }}>Каталог товаров</span>
      </TopBar>

      {/* 🔲 Сетка товаров */}
      <Grid>
        {products.map((p) => {
          const qty = getQty(p.id);
          const icon = getIcon(qty);

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
                  <Price>{(p.price ?? 0).toLocaleString("ru-RU")} руб</Price>
                  <Name>{p.name}</Name>
                </PriceBlock>

              <CartBtnWrap
                onClick={(e) => { e.stopPropagation(); addItem(p, 1); }}
                aria-label={qty > 0 ? `В корзине: ${qty}` : "В корзину"}
              >
                {/* сама корзина */}
                <img src={icon} alt="" />

                {/* кружок + количество (только если есть товар) */}
                {qty > 0 && (
                  <CartBadge>
                    {qty > 9 ? "9+" : qty}
                  </CartBadge>
                )}
              </CartBtnWrap>
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
  padding: 16px;
  font-family: "Montserrat", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
`;

const TopBar = styled.header`
  background: #fff;
  color: #000;
  border-radius: 10px;
  height: 44px;
  display: grid;
  grid-template-columns: 40px 1fr;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  margin-bottom: 10px;
`;

const BackArrow = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-right: 12px;

  img {
    width: 16px;
    height: 16px;
  }
`;

const Grid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, 1fr);
`;

const Card = styled.div`
  background: transparent;
  border: 2px solid #000; /* внутренняя тень мы не рисуем, оставим чисто */
  border-radius: 8px;
  overflow: hidden;
  padding: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const ProductImage = styled.img`
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border: 2px solid #f5a300;
  border-radius: 6px;
  display: block;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  gap: 8px;
`;

const PriceBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Price = styled.div`
  font-weight: 800;
  font-size: 16px;
`;

const Name = styled.div`
  font-size: 14px;
  color: #ccc;
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

  img {
    width: var(--icon-size);
    height: var(--icon-size);
    display: block;
    object-fit: contain;
  }
`;

const CartBadge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
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

/* Счётчик поверх жёлтого кружка в SVG */
const CartCount = styled.span`
  position: absolute;
  top: 0px;      /* подгони под свой кружок */
  right: 6px;    /* подгони под свой кружок */
  width: 2px;   /* диаметр твоего жёлтого круга в SVG */
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 8px;
  font-weight: 800;
  color: #000;   /* чёрный, чтобы читалось на жёлтом */
  line-height: 1;
  pointer-events: none;
`;
