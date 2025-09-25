// src/pages/HomePage.jsx
import React, { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import useEmblaCarousel from "embla-carousel-react";

import products from "../data/products";
import { useCart } from "../context/CartContext";

const PUB = process.env.PUBLIC_URL || "";

export default function HomePage() {
  const navigate = useNavigate();
  const { cart, addItem } = useCart();

  // embla — только для горизонтального скролла
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
    loop: false,
  });

  // Всегда переходим на страницу товара
  const handleTap = useCallback(
    (id) => navigate(`/product/${id}`),
    [navigate]
  );

  // Вспомогалки
  const getQty = (id) => cart.find((x) => x.id === id)?.qty || 0;
  const getIcon = (qty) =>
    qty > 0
      ? `${PUB}/assets/images/productCartActive.svg`
      : `${PUB}/assets/images/productCart.svg`;

  return (
    <Page>
      {/* Герой */}
      <HeroWrap>
        <HeroImg
          src={`${PUB}/assets/images/background_homepage.svg`}
          alt="Paradigma hookah"
        />
        {/* Лого поверх баннера */}
        <LogoOverlay aria-hidden="true">
          <img src={`${PUB}/assets/images/paradigmaLogoo.svg`} alt="Paradigma" />
        </LogoOverlay>
      </HeroWrap>

      {/* Преимущества */}
      <BenefitsBar>
        <Benefit>
          <BenefitIcon src={`${PUB}/assets/images/noRisk.svg`} alt="" />
          <BenefitText>Без риска</BenefitText>
        </Benefit>
        <Benefit>
          <BenefitIcon src={`${PUB}/assets/images/noAsh.svg`} alt="" />
          <BenefitText>Без пепла</BenefitText>
        </Benefit>
        <Benefit>
          <BenefitIcon src={`${PUB}/assets/images/noCoal.svg`} alt="" />
          <BenefitText>Без угля</BenefitText>
        </Benefit>
      </BenefitsBar>

      {/* Каталог */}
      <Section>
      <SectionHeaderRow>
        <Link
          to="/catalog"
          style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center" }}
        >
          <SectionTitle>
            Каталог товаров
            <ChevronIcon
              src={`${process.env.PUBLIC_URL}/assets/images/catalogArrow.svg`}
              alt=">"
            />
          </SectionTitle>
        </Link>
      </SectionHeaderRow>

        <CatalogViewport ref={emblaRef}>
          <CatalogSlides>
            {products.map((p) => {
              const qty = getQty(p.id);
              const icon = getIcon(qty);
              return (
                <CatalogSlide key={p.id}>
                  {/* ВЕСЬ блок кликабельный */}
                  <Card
                    role="button"
                    tabIndex={0}
                    onClick={() => handleTap(p.id)}
                    onKeyDown={(e) => e.key === "Enter" && handleTap(p.id)}
                  >
                    <CardImage
                      src={p.images?.[0] || `${PUB}/assets/images/placeholder.png`}
                      alt={p.name}
                      loading="lazy"
                    />

                    <CardBottomRow>
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
                    </CardBottomRow>
                  </Card>
                </CatalogSlide>
              );
            })}
          </CatalogSlides>
        </CatalogViewport>
      </Section>
    </Page>
  );
}

/* ===================== styled ===================== */

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

const Page = styled.main`
  background: #000;
  color: #fff;
  min-height: 100dvh;
  padding-bottom: calc(80px + env(safe-area-inset-bottom));
  font-family: "Montserrat", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
`;

const HeroWrap = styled.div`
  position: relative;
  width: 100%;
  overflow: hidden;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
`;

const LogoOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
  z-index: 1;

  img {
    width: clamp(250px, 36vw, 320px);
    height: auto;
    filter: drop-shadow(0 2px 8px rgba(0,0,0,.6));
  }
`;

const HeroImg = styled.img`
  width: 100%;
  display: block;
  height: auto;
`;

const BenefitsBar = styled.div`
  background: #fff;
  color: #000;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 14px 10px;
  gap: 10px;
`;
const Benefit = styled.div`
  display: grid;
  justify-items: center;
  gap: 6px;
`;
const BenefitIcon = styled.img`
  width: 40px;
  height: 40px;
  display: block;
`;
const BenefitText = styled.div`
  font-weight: 600;
  font-size: 14px;
`;


const Section = styled.section`
  padding: 14px var(--side-pad, 16px) 6px;
`;
const SectionHeaderRow = styled.div`
  display: flex;
  align-items: center;
  margin: 6px 0 10px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-weight: 800;
  font-size: 20px;
  display: inline-flex;     /* вместо flex — inline-flex */
  align-items: center;      /* центрируем по вертикали */
  gap: 6px;                 /* расстояние между текстом и стрелкой */
  line-height: 1;           /* убираем лишние отступы */
`;

const ChevronIcon = styled.img`
  width: 15px;
  height: 15px;
  display: block;           /* чтобы убрать влияние baseline */
  margin-top: 6px;          /* можно чуть подогнать вручную */
`;

/* ——— свайп-карусель каталога ——— */
const CatalogViewport = styled.div`
  overflow: hidden;
`;
const CatalogSlides = styled.div`
  display: flex;
  gap: 16px;
  padding-bottom: 6px;
  user-select: none;
  -webkit-user-select: none;
`;
const CatalogSlide = styled.div`
  /* карточка почти на всю ширину экрана */
  flex: 0 0 86%;
  max-width: 520px;

  @media (min-width: 480px) {
    flex-basis: 360px;
  }
`;

const Card = styled.div`
  background: #0b0b0b;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 0 0 2px #000000ff inset;
  cursor: pointer;
  outline: none;
`;
const CardImage = styled.img`
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border: 2px solid #f5a300;
  border-radius: 10px;
  display: block;
`;
const CardBottomRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  gap: 10px;
`;
const PriceBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;
const Price = styled.div`
  font-size: 18px;
  font-weight: 800;
`;
const Name = styled.div`
  font-size: 14px;
  color: #cfcfcf;
`;
