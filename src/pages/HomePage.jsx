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
  const { addItem } = useCart();

  // embla — только для горизонтального скролла (тапы обрабатываем сами)
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
    loop: false,
  });

  // ВСЕГДА переходим на страницу товара
  const handleTap = useCallback(
    (id) => {
      navigate(`/product/${id}`);
    },
    [navigate]
  );

  // Добавление в корзину
  const handleAddToCart = useCallback(
    (e, product) => {
      e.stopPropagation(); // чтобы не сработал переход на карточку
      addItem(product, 1);
    },
    [addItem]
  );

  return (
    <Page>
      {/* Герой */}
      <HeroWrap>
        <HeroImg
          src={`${PUB}/assets/images/background_homepage.svg`}
          alt="Paradigma hookah"
        />

      {/* ЛОГО поверх баннера */}
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
          <Link to="/catalog" style={{ textDecoration: "none", color: "inherit" }}>
            <SectionTitle>Каталог товаров</SectionTitle>
          </Link>
          <Chevron>›</Chevron>
        </SectionHeaderRow>

        <CatalogViewport ref={emblaRef}>
          <CatalogSlides>
            {products.map((p) => (
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

                    <CartBtn
                      type="button"
                      onClick={(e) => handleAddToCart(e, p)}
                      aria-label="В корзину"
                      title="В корзину"
                    >
                      <img src={`${PUB}/assets/images/productCart.svg`} alt="" />
                    </CartBtn>
                  </CardBottomRow>
                </Card>
              </CatalogSlide>
            ))}
          </CatalogSlides>
        </CatalogViewport>
      </Section>
    </Page>
  );
}

/* ===================== styled ===================== */

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
  inset: 0;                 /* занимает весь баннер */
  display: grid;
  place-items: center;      /* центрируем по X/Y */
  pointer-events: none;     /* логотип не перехватывает клики */
  z-index: 1;

  img {
    width: clamp(250px, 36vw, 320px); /* адаптивный размер */
    height: auto;
    filter: drop-shadow(0 2px 8px rgba(0,0,0,.6)); /* чтобы читалось на дыме */
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
  justify-content: space-between;
  margin: 6px 0 10px;
`;
const SectionTitle = styled.h2`
  margin: 0;
  font-weight: 800;
  font-size: 20px;
`;
const Chevron = styled.div`
  font-size: 22px;
  line-height: 1;
  user-select: none;
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
const CartBtn = styled.button`
  background: none;
  border: 2px solid #000000ff;
  border-radius: 12px;
  padding: 8px;
  display: grid;
  place-items: center;
  cursor: pointer;

  &:hover {
    background: #f5a30022;
  }

  img {
    width: 40px;
    height: 40px;
    display: block;
  }
`;
