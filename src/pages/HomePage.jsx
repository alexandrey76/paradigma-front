// src/pages/HomePage.jsx
import React, { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import useEmblaCarousel from "embla-carousel-react";

import { getTgContext, cartDelta, fetchCart } from "../api/cartApi";
import products from "../data/products";
import { useCart } from "../context/CartContext";

const PUB = process.env.PUBLIC_URL || "";

export default function HomePage() {
  const navigate = useNavigate();
  const { cart, addItem } = useCart();

  const [emblaRef] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
    loop: false,
  });

  const handleTap = useCallback(
    (id) => navigate(`/product/${id}`),
    [navigate]
  );

  const getQty = (id) => cart.find((x) => x.id === id)?.qty || 0;
  const getIcon = (qty) =>
    qty > 0
      ? `${PUB}/assets/images/productCartActive.svg`
      : `${PUB}/assets/images/productCart.svg`;

  const onAdd = async (product) => {
    try {
      await handleCartAction("add", product);
      addItem(product, 1);
    } catch (e) {
      console.error(e);
      alert(`Не удалось добавить в корзину: ${e.message || e}`);
    }
  };

  return (
    <Page>
      {/* Герой */}
      <HeroWrap>
        <HeroImg
          src={`${PUB}/assets/images/background_homepage.svg`}
          alt="Paradigma hookah"
        />
        <LogoOverlay aria-hidden="true">
          <img
            src={`${PUB}/assets/images/paradigmaLogoo.svg`}
            alt="Paradigma"
          />
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
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              alignItems: "center",
            }}
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
                  <Card
                    role="button"
                    tabIndex={0}
                    onClick={() => handleTap(p.id)}
                    onKeyDown={(e) => e.key === "Enter" && handleTap(p.id)}
                  >
                    <CardImage
                      src={
                        p.images?.[0] || `${PUB}/assets/images/placeholder.png`
                      }
                      alt={p.name}
                      loading="lazy"
                    />

                    <CardBottomRow>
                      <PriceBlock>
                        <Price>
                          {(p.price ?? 0).toLocaleString("ru-RU")} руб
                        </Price>
                        <Name>{p.name}</Name>
                      </PriceBlock>

                      <CartBtnWrap
                        onClick={async (e) => {
                          e.stopPropagation();
                          onAdd(p);
                          try { await cartDelta({ product: i, setQty: newQty }); } catch (err) { console.error(err); }
                        }}
                        aria-label={
                          qty > 0 ? `В корзине: ${qty}` : "В корзину"
                        }
                      >
                        <img src={icon} alt="" />
                        {qty > 0 && (
                          <CartBadge>{qty > 9 ? "9+" : qty}</CartBadge>
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

      {/* Футер */}
      <FooterWrap>
        <FooterLogoBlock>
          <img src={`${PUB}/assets/images/footerLogo.svg`} alt="Paradigma" />
          <FooterTagline>Электронные кальяны без угля</FooterTagline>
        </FooterLogoBlock>

        <FooterMain>
          <FooterLeft>
            <PolicyBlock>
              <PolicyLine>
                <Link to="/privacy-policy">Политика конфиденциальности</Link>
              </PolicyLine>
              <PolicyLine>
                <Link to="/consent">Согласие на обработку персональных данных</Link>
              </PolicyLine>
              <PolicyLine>ИНН: 771588377502</PolicyLine>
              <PolicyLine>ОГРИП: 32577460063823</PolicyLine>
              <PolicyLine>
                Информация в приложении носит ознакомительный характер и не
                является публичной офертой.
              </PolicyLine>
            </PolicyBlock>
          </FooterLeft>

          <FooterRight>
            <PhoneBlock>
              <PhoneLabel>Телефон:</PhoneLabel>
              <PhoneNumber href="tel:+79911851101">
                +7 (991) 185-11-01
              </PhoneNumber>
            </PhoneBlock>
            <SocialBlock>
              <SocialLabel>Социальные сети:</SocialLabel>
              <SocialRow>
                <a
                  href="https://t.me/+FUNSyKGQhfQzZmY6"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src={`${PUB}/assets/images/tgLogo.svg`} alt="Telegram" />
                </a>
                <a
                  href="https://www.instagram.com/paradigma_hookah?igsh=M2s2bzJ4cGxyZ3Q5&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={`${PUB}/assets/images/instLogo.svg`}
                    alt="Instagram"
                  />
                </a>
              </SocialRow>
            </SocialBlock>
          </FooterRight>
        </FooterMain>

        <FooterBottom>
          <WarningTitle>КУРЕНИЕ ВРЕДИТ ВАШЕМУ ЗДОРОВЬЮ! 18+</WarningTitle>
          <WarningText>
            Дистанционная продажа товаров подпадающих под запрет ФЗ 15 не
            осуществляется. Товары можно приобрести только в нашем магазине или
            у дилеров. Резерв товара, оформленного через приложение не является
            заключённым договором о намерениях приобрести товар. Сделка по
            приобретению товара осуществляется только при предъявлении паспорта.
            Ограничения ФЗ 15 не действуют для оптовых заказов. Приложение не
            является рекламой, это каталог для совершеннолетних потребителей
            табачной продукции (граждан России старше 18 лет) для предоставления
            им достоверной информации об основных потребительских свойствах и
            качественных характеристик товаров (п.1 и п.2 ст. 10 Закона «О
            защите прав Потребителя»).
          </WarningText>
        </FooterBottom>
      </FooterWrap>
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
  font-family: "Montserrat", system-ui, -apple-system, Segoe UI, Roboto, Arial,
    sans-serif;
`;

/* ——— Герой ——— */
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
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.6));
  }
`;

const HeroImg = styled.img`
  width: 100%;
  display: block;
`;

/* ——— Преимущества ——— */
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

/* ——— Каталог ——— */
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
  line-height: 1;
`;
const ChevronIcon = styled.img`
  width: 15px;
  height: 15px;
  display: block;
  margin-top: 6px;
`;
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
  border: 2px solid #f1efeaff;
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

/* ——— Футер ——— */
const FooterWrap = styled.footer`
  background: #f6b201;
  color: #000;
  border: 2px solid #000;
  border-radius: 12px;
  padding: 20px;
  margin: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FooterLogoBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  img {
    width: 130px;
    height: auto;
  }
`;

const FooterTagline = styled.div`
  font-weight: 600;
  font-size: 14px;
  text-align: center;
`;

const FooterMain = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
`;

const FooterLeft = styled.div`
  flex: 1;
  min-width: 220px;
  text-align: left;
`;

const FooterRight = styled.div`
  flex: 1;
  min-width: 200px;
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 14px;

  @media (max-width: 600px) {
    text-align: left;
    align-items: flex-start;
  }
`;

const PolicyBlock = styled.div`
  font-size: 12px;
  line-height: 1.3;
  font-weight: 500;

  a {
    color: #000;
    text-decoration: underline;
    font-weight: 600;
  }
`;

const PolicyLine = styled.div`
  margin-bottom: 6px;
`;

const PhoneBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;
const PhoneLabel = styled.div`
  font-size: 12px;
`;
const PhoneNumber = styled.a`
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  color: #000;
  display: block;
  margin-top: 2px;
`;
const SocialBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
`;
const SocialLabel = styled.div``;
const SocialRow = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;

  @media (max-width: 600px) {
    justify-content: flex-start;
  }

  img {
    width: 22px;
    height: 22px;
  }
`;

const FooterBottom = styled.div`
  background: #000;
  color: #fff;
  padding: 14px;
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.4;
`;

const WarningTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 6px;
  text-transform: uppercase;
`;
const WarningText = styled.div`
  font-size: 12px;
  line-height: 1.4;
  font-weight: 400;
`;
