// src/pages/ProductPage.jsx
import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import useEmblaCarousel from "embla-carousel-react";
import products from "../data/products";
import { useCart } from "../context/CartContext";
import TopBar from "../components/TopBar";

const PUB = process.env.PUBLIC_URL || "";
const COMMON_BUTTON_HEIGHT = "44px";

export default function ProductPage() {
  const { id } = useParams();
  const { addItem, getItemQuantity, setQty } = useCart();

  // товар
  const product = useMemo(
    () => products.find((p) => p.id === Number(id)),
    [id]
  );

  // медиа
  const media = useMemo(() => {
    if (!product) return [];
    const vids = (product.videos || []).map((mp4) => ({ type: "video", mp4 }));
    const imgs = (product.images || []).map((src) => ({ type: "image", src }));
    return [...vids, ...imgs];
  }, [product]);

  // комплектация
  const configItems = useMemo(() => {
    const raw0 = product?.configuration || "";
    const noFence = raw0.replace(/```/g, "");
    const noHeader = noFence.replace(/^Комплектация:\s*/i, "");
    return noHeader
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.replace(/^[-•]\s*/, "").trim());
  }, [product]);

  // карусель
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    dragFree: false,
    align: "center",
    containScroll: "trimSnaps",
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  // анимации
  const [addPressed, setAddPressed] = useState(false);
  const [decPressed, setDecPressed] = useState(false);
  const [incPressed, setIncPressed] = useState(false);

  // сколько в корзине
  const qtyInCart =
    product && typeof getItemQuantity === "function"
      ? getItemQuantity(product.id)
      : 0;

  // всегда актуальное кол-во (для быстрого спама по "-")
  const qtyRef = useRef(qtyInCart);
  useEffect(() => {
    qtyRef.current = qtyInCart;
  }, [qtyInCart]);

  const pauseAllVideosExcept = useCallback(
    (index) => {
      if (!emblaApi) return;
      const root = emblaApi.rootNode();
      const videos = root.querySelectorAll("video");
      videos.forEach((v, i) => {
        if (i !== index && !v.paused) {
          try {
            v.pause();
          } catch {}
        }
      });
    },
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const i = emblaApi.selectedScrollSnap();
    setSelectedIndex(i);
    pauseAllVideosExcept(i);
  }, [emblaApi, pauseAllVideosExcept]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  // при смене товара — листаем в начало
  useEffect(() => {
    if (emblaApi) {
      setSelectedIndex(0);
      emblaApi.scrollTo(0, true);
    }
  }, [id, emblaApi]);

  // хаптика
  const haptic = () => {
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred("medium");
      } else if ("vibrate" in navigator) {
        navigator.vibrate(15);
      }
    } catch {}
  };

  // 1 handler = 1 вызов действия
  const makePointerPress = (setPressed, action) => ({
    onPointerDown: (e) => {
      e.preventDefault();
      setPressed(true);
    },
    onPointerUp: (e) => {
      e.preventDefault();
      setPressed(false);
      action?.();
    },
    onPointerLeave: () => setPressed(false),
    onPointerCancel: () => setPressed(false),
  });

  // действия
  const doAddFirst = async () => {
    if (!product) return;
    haptic();
    try {
      await addItem(product, 1);
    } catch (e) {
      console.error("Failed to add to cart:", e);
    }
  };

  const doInc = async () => {
    if (!product) return;
    haptic();
    try {
      await addItem(product, 1);
    } catch (e) {
      console.error(e);
    }
  };

  const doDec = async () => {
    if (!product) return;
    haptic();
    try {
      const current = qtyRef.current || 0;
      const next = Math.max(0, current - 1); // не ниже 0
      await setQty(product.id, next);
    } catch (e) {
      console.error(e);
    }
  };

  // рендер "товара нет" — после всех хуков
  if (!product) {
    return (
      <FullBleed>
        <Page>
          <TopBar svgSrc="./assets/images/topLogo.svg" />
          <EmptyWrap>Товар не найден</EmptyWrap>
        </Page>
      </FullBleed>
    );
  }

  const prev = () => emblaApi && emblaApi.scrollPrev();
  const next = () => emblaApi && emblaApi.scrollNext();

  return (
    <FullBleed>
      <Page>
        <TopBar svgSrc="./assets/images/topLogo.svg" />
        <Title>{product.name}</Title>

        {/* MEDIA */}
        <MediaBox>
          <Viewport ref={emblaRef}>
            <Slides>
              {media.map((m, i) => {
                const blurSrc =
                  m.type === "image"
                    ? m.src
                    : product.images?.[0] ||
                      `${PUB}/assets/images/placeholder.png`;
                return (
                  <Slide key={i}>
                    <BlurBg style={{ backgroundImage: `url(${blurSrc})` }} />
                    {m.type === "image" ? (
                      <Img src={m.src} alt={`${product.name} ${i + 1}`} />
                    ) : (
                      <Vid
                        autoPlay
                        controls
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <source src={m.mp4} type="video/mp4" />
                      </Vid>
                    )}
                  </Slide>
                );
              })}
            </Slides>
          </Viewport>

          {media.length > 1 && (
            <>
              <NavArrow left aria-label="Назад" onClick={prev}>
                <img src={`${PUB}/assets/images/leftArrow.svg`} alt="Назад" />
              </NavArrow>
              <NavArrow aria-label="Вперёд" onClick={next}>
                <img src={`${PUB}/assets/images/rightArrow.svg`} alt="Вперед" />
              </NavArrow>

              <Dots>
                {media.map((_, i) => (
                  <Dot
                    key={i}
                    aria-label={`Слайд ${i + 1}`}
                    $active={i === selectedIndex}
                    onClick={() => emblaApi && emblaApi.scrollTo(i)}
                  />
                ))}
              </Dots>
            </>
          )}
        </MediaBox>

        <PriceRow>
          <Price>{(product.price ?? 0).toLocaleString("ru-RU")} ₽</Price>

          {qtyInCart > 0 ? (
            <QtyBox>
              <QtyBtn
                {...makePointerPress(setDecPressed, doDec)}
                $pressed={decPressed}
                aria-label="Уменьшить количество"
              >
                <span className="btn-icon">–</span>
              </QtyBtn>
              <QtyText>{qtyInCart} шт.</QtyText>
              <QtyBtn
                {...makePointerPress(setIncPressed, doInc)}
                $pressed={incPressed}
                aria-label="Увеличить количество"
              >
                <span className="btn-icon">+</span>
              </QtyBtn>
            </QtyBox>
          ) : (
            <AddBtn
              {...makePointerPress(setAddPressed, doAddFirst)}
              $pressed={addPressed}
            >
              Добавить в корзину
            </AddBtn>
          )}
        </PriceRow>

        {/* описание */}
        {product.description && (
          <p style={{ margin: "8px 0 0", color: "#d6d6d6", lineHeight: 1.5 }}>
            {product.description}
          </p>
        )}

        {/* комплектация */}
        {configItems.length > 0 && (
          <SpecBlock>
            <SpecTitle>Набор:</SpecTitle>
            <SpecList>
              {configItems.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </SpecList>
          </SpecBlock>
        )}
      </Page>
    </FullBleed>
  );
}

/* =============== styled =============== */
const FullBleed = styled.div`
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  background: #000;
`;

const Page = styled.main`
  padding: 12px var(--side-pad, 16px) calc(110px + env(safe-area-inset-bottom));
  min-height: 100dvh;
  color: #fff;
  font-family: "Montserrat", system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  max-width: 720px;
  margin: 0 auto;
`;

const EmptyWrap = styled.div`
  min-height: 60vh;
  display: grid;
  place-items: center;
  color: #fff;
  background: #000;
`;

const Title = styled.h1`
  margin: 8px 0 10px;
  font-size: 18px;
  font-weight: 800;
`;

const MediaBox = styled.div`
  position: relative;
  width: 100%;
  max-width: 100%;
  margin: 8px 0 18px;
  aspect-ratio: 1 / 1;
  border: 2px solid #fff;
  border-radius: 12px;
  overflow: hidden;
  background: #111;
`;

const Viewport = styled.div`
  overflow: hidden;
  width: 100%;
  height: 100%;
`;
const Slides = styled.div`
  display: flex;
  height: 100%;
  touch-action: pan-y pinch-zoom;
`;
const Slide = styled.div`
  position: relative;
  flex: 0 0 100%;
  height: 100%;
  overflow: hidden;
`;

const BlurBg = styled.div`
  position: absolute;
  inset: 0;
  background-position: center;
  background-size: cover;
  filter: blur(24px) brightness(0.6);
  transform: scale(1.08);
  z-index: 0;
`;

const Img = styled.img`
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const Vid = styled.video`
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: transparent;
`;

const NavArrow = styled.button`
  position: absolute;
  top: 50%;
  ${(p) => (p.left ? "left: 6px;" : "right: 6px;")}
  transform: translateY(-50%);
  border-radius: 50%;
  border: 2px solid #fff;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;

  img {
    width: 35px;
    height: 35px;
    display: block;
  }
`;

const Dots = styled.div`
  position: absolute;
  bottom: 6px;
  left: 0;
  right: 0;
  display: flex;
  gap: 6px;
  justify-content: center;
  z-index: 2;
`;
const Dot = styled.button`
  width: 8px;
  height: 8px;
  border-radius: 999px;
  border: none;
  background: ${(p) => (p.$active ? "#f5b300" : "rgba(255,255,255,.5)")};
`;

const PriceRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  margin: 6px 0 10px;

  @media (max-width: 360px) {
    grid-template-columns: 1fr;
  }
`;
const Price = styled.div`
  font-weight: 900;
  font-size: 24px;
`;

const AddBtn = styled.button`
  height: ${COMMON_BUTTON_HEIGHT};
  border: 2px solid #f5b300;
  background: #000;
  color: #fff;
  border-radius: 10px;
  padding: 0 16px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  min-width: 160px;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 120ms ease-out, box-shadow 120ms ease-out;
  box-shadow: ${(p) =>
    p.$pressed ? "0 0 0 rgba(0,0,0,0)" : "0 3px 8px rgba(0,0,0,.25)"};
  transform: ${(p) => (p.$pressed ? "scale(.965)" : "scale(1)")};
  -webkit-tap-highlight-color: transparent;
`;

const QtyBox = styled.div`
  height: ${COMMON_BUTTON_HEIGHT};
  display: grid;
  grid-template-columns: auto auto auto;
  gap: 12px;
  align-items: center;
  border: 2px solid #f5b300;
  background: #000;
  border-radius: 10px;
  padding: 0 10px;
  min-width: 160px;
  box-sizing: border-box;
`;

const QtyBtn = styled.button`
  background: transparent;
  border: none;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 110ms ease-out;
  transform: ${(p) => (p.$pressed ? "scale(.9)" : "scale(1)")};
  width: 46px;
  height: 100%;
  -webkit-tap-highlight-color: transparent;
  outline: none;
  touch-action: manipulation;

  .btn-icon {
    pointer-events: none;
  }
`;

const QtyText = styled.div`
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  text-align: center;
`;

const SpecBlock = styled.section`
  margin-top: 8px;
`;
const SpecTitle = styled.div`
  margin-bottom: 6px;
  font-weight: 700;
`;
const SpecList = styled.ul`
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 4px;
  li {
    color: #d6d6d6;
  }
`;
