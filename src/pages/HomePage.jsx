import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import styled, { createGlobalStyle } from "styled-components";
import products from "../data/products";

// базовый префикс для public/
const PUB = process.env.PUBLIC_URL || "";

/** Скролл к форме */
export function scrollToContact() {
  const el = document.getElementById("contact-form");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Глобальные стили (минимум, безопасно для WebView) */
const GlobalStyle = createGlobalStyle`
  html, body, #root { height: 100%; }
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    background: #0c0c0c;
    color: #fff;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  img { display:block; max-width:100%; }
  :root { --side-pad: clamp(12px, 3vw, 24px); }
`;

/** Страница */
export default function HomePage() {
  const [params] = useSearchParams();

  // автоскролл к форме
  useEffect(() => {
    if (params.get("scroll") === "contact") {
      const t = setTimeout(scrollToContact, 120);
      return () => clearTimeout(t);
    }
  }, [params]);

  // приличия для Telegram WebApp (если есть)
  useEffect(() => {
    const wa = window.Telegram?.WebApp;
    if (wa) {
      wa.expand?.();
      wa.disableVerticalSwipes?.();
    }
  }, []);

  return (
    <>
      <GlobalStyle />

      <Page>
        {/* HERO */}
        <FullBleed>
          <Hero>
            <HeroBg
              src={PUB + "/assets/images/background_homepage.svg"}
              alt=""
            />
            <HeroOverlay />
            <HeroContent>
              <Logo
                src={PUB + "/assets/images/paradigmaLogoo.svg"}
                alt="PARADIGMA"
                draggable={false}
              />
            </HeroContent>
          </Hero>
        </FullBleed>

        {/* BENEFITS */}
        <FullBleed>
          <BenefitsBar>
            <Benefit>
              <Icon>
                <img src={PUB + "/assets/images/noRisk.svg"} alt="Без риска" />
              </Icon>
              <BenefitText>Без риска</BenefitText>
            </Benefit>
            <Benefit>
              <Icon>
                <img src={PUB + "/assets/images/noAsh.svg"} alt="Без пепла" />
              </Icon>
              <BenefitText>Без пепла</BenefitText>
            </Benefit>
            <Benefit>
              <Icon>
                <img src={PUB + "/assets/images/noCoal.svg"} alt="Без угля" />
              </Icon>
              <BenefitText>Без угля</BenefitText>
            </Benefit>
          </BenefitsBar>
        </FullBleed>

        {/* CATALOG */}
        <Section>
          <SectionHeader>
            <SectionTitle>Каталог товаров</SectionTitle>
            <Chevron>›</Chevron>
          </SectionHeader>

          <CardsScroller>
            {products.map((p) => (
              <Card key={p.id}>
                <CardImage>
                  {p.images && p.images.length > 0 ? (
                    <img src={p.images[0]} alt={p.name} />
                  ) : (
                    <Placeholder>Нет фото</Placeholder>
                  )}
                </CardImage>

                <CardPriceRow>
                  <Price>{(p.price ?? 0).toLocaleString()} ₽</Price>
                  <IconBtn type="button" aria-label="В корзину">
                    🛒
                  </IconBtn>
                </CardPriceRow>

                <CardTitle>{p.name}</CardTitle>
              </Card>
            ))}
          </CardsScroller>
        </Section>

        {/* CONTACT FORM */}
        <ContactSection id="contact-form">
          <FormHeader>
            <FormIcon>💬</FormIcon>
            <FormTitle>Ответим на ваши вопросы</FormTitle>
          </FormHeader>

          <Form onSubmit={(e) => e.preventDefault()}>
            <Input type="text" placeholder="Введите ваше имя" />
            <Input type="text" placeholder="Контактные данные" />
            <Textarea placeholder="Комментарий и вопрос" rows={4} />
            <SendBtn type="submit">Отправить</SendBtn>
          </Form>
        </ContactSection>

        {/* FOOTER */}
        <Footer>
          <SmallLogo
            src={PUB + "/assets/images/paradigmaLogoo.svg"}
            alt="Paradigma"
          />
          <Copy>© Paradigma</Copy>
        </Footer>
      </Page>
    </>
  );
}

/* ================== styled-components ================== */

const Page = styled.div`
  width: 100%;
  max-width: 100vw;
  min-height: 100dvh;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  padding-left: var(--side-pad);
  padding-right: var(--side-pad);

  @supports (padding: env(safe-area-inset-left)) {
    padding-left: max(var(--side-pad), env(safe-area-inset-left));
    padding-right: max(var(--side-pad), env(safe-area-inset-right));
  }
`;

/** Растяжка во всю ширину экрана */
const FullBleed = styled.div`
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
`;

/* HERO */
const Hero = styled.section`
  position: relative;
  width: 100%;
  aspect-ratio: 390 / 470; /* мобильный макет */
  min-height: 360px;
  border-radius: 0 0 16px 16px;
  overflow: hidden;
`;

const HeroBg = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const HeroOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: radial-gradient(transparent 30%, rgba(0, 0, 0, 0.6) 85%);
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
`;

const Logo = styled.img`
  width: min(70%, 520px);
  height: auto;
  transform: translateY(-4%);
`;

/* BENEFITS */
const BenefitsBar = styled.div`
  background: #fff;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 18px var(--side-pad);
  align-items: center;
  text-align: center;
`;

const Benefit = styled.div`
  display: grid;
  justify-items: center;
  gap: 6px;
`;

const Icon = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
`;

const BenefitText = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #111;
`;

/* CATALOG */
const Section = styled.section`
  width: 100%;
  padding: 16px 0 8px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 800;
  margin: 0;
`;

const Chevron = styled.span`
  font-size: 26px;
  color: #f5b300;
  line-height: 1;
`;

/** Горизонтальный скролл без Embla (безопасно для WebView) */
const CardsScroller = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 82%;
  gap: 12px;
  overflow-x: auto;
  padding: 8px 0 14px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar {
    display: none;
  }

  @media (min-width: 600px) {
    grid-auto-columns: 46%;
  }
  @media (min-width: 900px) {
    grid-auto-columns: 32%;
  }
`;

const Card = styled.article`
  background: #0f0f0f;
  border-radius: 16px;
  padding: 10px;
  scroll-snap-align: start;
  position: relative;
`;

const CardImage = styled.div`
  aspect-ratio: 1 / 1;        /* квадрат */
  width: 100%;
  border-radius: 12px;
  border: 1px solid #f5b300;  /* жёлтая рамка */
  overflow: hidden;
  background: #171717;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;        /* заполняем квадрат */
  }
`;

const Placeholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #777;
  font-size: 12px;
`;

const CardPriceRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10px 2px 4px;
`;

const Price = styled.div`
  font-weight: 800;
  font-size: 16px;
`;

const IconBtn = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid #f5b300;
  background: transparent;
  color: #f5b300;
`;

const CardTitle = styled.div`
  font-size: 12px;
  opacity: 0.9;
  line-height: 1.3;
`;

/* CONTACT */
const ContactSection = styled.section`
  width: 100%;
  margin-top: 8px;
  padding: 16px 0 24px;
  background: #0c0c0c;
`;

const FormHeader = styled.div`
  display: grid;
  justify-items: center;
  gap: 6px;
  margin-bottom: 10px;
`;

const FormIcon = styled.div`
  font-size: 22px;
`;

const FormTitle = styled.h3`
  margin: 0;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
`;

const Form = styled.form`
  display: grid;
  gap: 8px;
`;

const field = `
  width: 100%;
  border-radius: 12px;
  border: 1px solid #2a2a2a;
  background: #121212;
  color: #fff;
  padding: 12px 12px;
  font-size: 14px;
  outline: none;
  &::placeholder { color: #8b8b8b; }
  &:focus { border-color: #f5b300; box-shadow: 0 0 0 3px rgba(245,179,0,.15); }
`;

const Input = styled.input`${field}`;
const Textarea = styled.textarea`${field}; resize: none;`;

const SendBtn = styled.button`
  border: 0;
  border-radius: 12px;
  background: #f5b300;
  color: #111;
  font-weight: 800;
  padding: 12px 18px;
  margin-top: 10px;
`;

/* FOOTER */
const Footer = styled.footer`
  width: 100%;
  border-top: 1px solid #1f1f1f;
  padding: 14px 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SmallLogo = styled.img`
  height: 20px;
  opacity: 0.9;
`;

const Copy = styled.div`
  font-size: 12px;
  color: #777;
`;
