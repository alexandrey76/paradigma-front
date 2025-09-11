import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import styled from "styled-components";

// ── утилита автоскролла к форме
export function scrollToContact() {
  const el = document.getElementById("contact-form");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function HomePage() {
  const [params] = useSearchParams();

  useEffect(() => {
    if (params.get("scroll") === "contact") {
      const t = setTimeout(scrollToContact, 120);
      return () => clearTimeout(t);
    }
  }, [params]);

  return (
    <Page>
      {/* HERO */}
      <Hero>
        <HeroBg
          src="/assets/images/background_homepage.svg"
          alt="Hookah background"
        />
        <HeroOverlay />
        <HeroContent>
          <Logo
            src="/assets/images/paradigmaLogoo.svg"
            alt="PARADIGMA"
            draggable={false}
          />
        </HeroContent>
      </Hero>

      {/* BENEFITS */}
      <BenefitsBar>
        <Benefit>
          <IconCircle>⚖️</IconCircle>
          <BenefitText>Без риска</BenefitText>
        </Benefit>
        <Benefit>
          <IconCircle>🪄</IconCircle>
          <BenefitText>Без пепла</BenefitText>
        </Benefit>
        <Benefit>
          <IconCircle>🍋</IconCircle>
          <BenefitText>Без угля</BenefitText>
        </Benefit>
      </BenefitsBar>

      {/* CATALOG */}
      <Section>
        <SectionHeader>
          <SectionTitle>Каталог товаров</SectionTitle>
          <Chevron>›</Chevron>
        </SectionHeader>

        <CardsScroller>
          {/* карточка 1 */}
          <Card>
            <CardImage />
            <CardPriceRow>
              <Price>17 990 ₽</Price>
              <CartBtn aria-label="В корзину">🛒</CartBtn>
            </CardPriceRow>
            <CardTitle>Электронный кальян Paradigma One</CardTitle>
          </Card>

          {/* карточка 2 */}
          <Card>
            <CardImage />
            <CardPriceRow>
              <Price>17 990 ₽</Price>
              <CartBtn aria-label="В корзину">🛒</CartBtn>
            </CardPriceRow>
            <CardTitle>Электронный кальян Paradigma One</CardTitle>
          </Card>

          {/* карточка 3 + стрелка */}
          <Card>
            <CardImage />
            <CardPriceRow>
              <Price>17 990 ₽</Price>
              <CartBtn aria-label="В корзину">🛒</CartBtn>
            </CardPriceRow>
            <CardTitle>Электронный кальян Paradigma One</CardTitle>
            <NextPill>›</NextPill>
          </Card>
        </CardsScroller>
      </Section>

      {/* CONTACT FORM */}
      <ContactSection id="contact-form">
        <FormHeader>
          <FormIcon>💬</FormIcon>
          <FormTitle>Ответим на ваши вопросы</FormTitle>
        </FormHeader>

        <Form>
          <Input type="text" placeholder="Введите ваше имя" />
          <Input type="text" placeholder="Контактные данные" />
          <Textarea placeholder="Комментарий и вопрос" rows={4} />
          <SendBtn type="button">Отправить</SendBtn>
        </Form>
      </ContactSection>

      {/* FOOTER */}
      <Footer>
        <FooterRow>
          <SmallLogo
            src="/assets/images/paradigmaLogoo.svg"
            alt="PARADIGMA"
          />
          <Socials>
            <SocLink href="#" aria-label="Instagram">📷</SocLink>
            <SocLink href="#" aria-label="Telegram">✈️</SocLink>
          </Socials>
        </FooterRow>
      </Footer>
    </Page>
  );
}

/* ─────────────────── styled-components ─────────────────── */

const Page = styled.div`
  /* центрируем и ограничиваем ширину под iPhone 14 Pro Max (430px) */
  width: 100%;
  max-width: 430px;
  margin: 0 auto;

  /* базовые цвета; для Telegram перекроем через CSS-переменные ниже */
  --bg: #0c0c0c;
  --fg: #ffffff;
  --accent: #f5b300;
  --muted: #2a2a2a;

  background: var(--bg);
  color: var(--fg);
  min-height: 100dvh; /* учитывает моб. URL bar */

  /* safe-area для iOS (чёлка/дом-индикатор) */
  padding-left: max(12px, env(safe-area-inset-left));
  padding-right: max(12px, env(safe-area-inset-right));
  padding-bottom: max(0px, env(safe-area-inset-bottom));

  display: flex;
  flex-direction: column;
  align-items: center;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  `;

const Hero = styled.section`
  position: relative;
  width: 100%;
  max-width: 480px;
  aspect-ratio: 9 / 11; /* визуально как на макете */
  overflow: hidden;
`;

const HeroBg = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
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
  padding-top: 6%;
`;

const Logo = styled.img`
  width: min(68%, 320px);
  height: auto;
`;

/* Benefits strip */
const BenefitsBar = styled.div`
  width: 100%;
  max-width: 480px;
  background: #111;
  border-top: 1px solid #2a2a2a;
  border-bottom: 1px solid #2a2a2a;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 14px 12px;
`;

const Benefit = styled.div`
  display: grid;
  justify-items: center;
  gap: 6px;
`;

const IconCircle = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: #f5b300; /* жёлтый из макета */
  color: #111;
  display: grid;
  place-items: center;
  font-size: 22px;
  font-weight: 700;
  box-shadow: 0 0 0 2px #111, 0 6px 16px rgba(245, 179, 0, 0.35);
`;

const BenefitText = styled.div`
  font-size: 12px;
  opacity: 0.9;
`;

/* Section reusable */
const Section = styled.section`
  width: 100%;
  max-width: 480px;
  padding: 16px 12px 8px;
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
  letter-spacing: 0.2px;
`;

const Chevron = styled.span`
  font-size: 26px;
  line-height: 1;
  color: #f5b300;
`;

/* Cards scroller */
const CardsScroller = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 78%;
  gap: 12px;
  overflow-x: auto;
  padding: 10px 2px 14px;
  scroll-snap-type: x mandatory;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Card = styled.article`
  background: #0f0f0f;
  border: 1px solid #262626;
  border-radius: 18px;
  padding: 10px;
  scroll-snap-align: start;
  position: relative;
`;

const CardImage = styled.div`
  height: 130px;
  border-radius: 12px;
  background: linear-gradient(180deg, #171717, #0e0e0e);
  border: 1px dashed #333;
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

const CartBtn = styled.button`
  border: 1px solid #f5b300;
  background: transparent;
  color: #f5b300;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  font-size: 16px;
`;

const CardTitle = styled.div`
  font-size: 12px;
  opacity: 0.9;
  line-height: 1.3;
`;

const NextPill = styled.div`
  position: absolute;
  right: 10px;
  top: 50%;
  translate: 0 -50%;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: #222;
  border: 1px solid #f5b300;
  color: #f5b300;
  display: grid;
  place-items: center;
  font-size: 20px;
`;

/* Contact form */
const ContactSection = styled.section`
  width: 100%;
  max-width: 480px;
  margin-top: 8px;
  padding: 16px 12px 24px;
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
  text-align: center;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.2;
  text-transform: uppercase;
`;

const Form = styled.form`
  display: grid;
  gap: 8px;
`;

const commonField = `
  width: 100%;
  border-radius: 12px;
  border: 1px solid #2a2a2a;
  background: #121212;
  color: #fff;
  padding: 12px 12px;
  font-size: 14px;
  outline: none;

  &::placeholder { color: #8b8b8b; }
  &:focus { border-color: #f5b300; box-shadow: 0 0 0 3px rgba(245, 179, 0, 0.15); }
`;

const Input = styled.input`${commonField}`;
const Textarea = styled.textarea`${commonField}; resize: none;`;

const SendBtn = styled.button`
  margin-top: 4px;
  width: 128px;
  justify-self: center;
  border-radius: 12px;
  background: #f5b300;
  color: #111;
  font-weight: 800;
  padding: 10px 14px;
  border: 0;
`;

/* Footer */
const Footer = styled.footer`
  width: 100%;
  max-width: 480px;
  padding: 16px 12px 28px;
`;

const FooterRow = styled.div`
  border-top: 1px solid #1f1f1f;
  padding-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SmallLogo = styled.img`
  height: 20px;
  width: auto;
  opacity: 0.9;
`;

const Socials = styled.div`
  display: flex;
  gap: 10px;
`;

const SocLink = styled.a`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid #2a2a2a;
  display: grid;
  place-items: center;
  color: #fff;
  text-decoration: none;
`;
