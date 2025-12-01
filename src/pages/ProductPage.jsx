// src/pages/ProductPage.jsx
import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import useEmblaCarousel from "embla-carousel-react";
import products from "../data/products";
import { useCart } from "../context/CartContext";
import TopBar from "../components/TopBar";
import makePointerPress from "../utils/makePointerPress"

const PUB = process.env.PUBLIC_URL || "";
const COMMON_BUTTON_HEIGHT = "44px";

// svg для предзаказа
const PREORDER_BADGE_SRC = `${PUB}/assets/images/preorderBadge.svg`;
const PREORDER_INFO_SRC = `${PUB}/assets/images/preorderInfo.svg`;

// кламп для ручного ввода: 1–999
const clampInputQty = (n) => {
  if (!Number.isFinite(n)) return 1;
  if (n <= 1) return 1;
  if (n >= 999) return 999;
  return n;
};

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, getItemQuantity, setQty } = useCart();

  const product = useMemo(
    () => products.find((p) => p.id === Number(id)),
    [id]
  );

  const isPreorder = product?.status === "preorder";

  // недоступность: либо inStock=false, либо stock=0
  const outOfStock =
    product?.inStock === false ||
    (typeof product?.stock === "number" && product.stock <= 0);

  // все варианты цвета для этого товара
  const colorVariants = useMemo(() => {
    if (!product || !Array.isArray(product.variantIds)) return [];
    const idsSet = new Set(product.variantIds);
    return products.filter((p) => idsSet.has(p.id));
  }, [product]);

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

  // количество в корзине
  const qtyInCart =
    product && typeof getItemQuantity === "function"
      ? getItemQuantity(product.id)
      : 0;

  // локальный ввод количества
  const [qtyDraft, setQtyDraft] = useState(
    qtyInCart ? String(qtyInCart) : "1"
  );
  const qtyRef = useRef(qtyInCart);

  useEffect(() => {
    qtyRef.current = qtyInCart;
    setQtyDraft(qtyInCart ? String(qtyInCart) : "1");
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

  // действия
  const doAddFirst = async () => {
    if (!product || outOfStock) return;
    haptic();
    try {
      await addItem(product, 1);
    } catch (e) {
      console.error("Failed to add to cart:", e);
    }
  };

  const doInc = async () => {
    if (!product || outOfStock) return;
    const current = qtyRef.current || 0;
    if (current >= 999) return; // дальше нельзя
    haptic();
    try {
      await addItem(product, 1);
    } catch (e) {
      console.error(e);
    }
  };

  const doDec = async () => {
    if (!product || outOfStock) return;
    const current = qtyRef.current || 0;
    haptic();
    try {
      if (current <= 1) {
        // 1 -> 0 => удаляем
        await setQty(product.id, 0);
      } else {
        await setQty(product.id, current - 1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ===== работа с вводом количества =====
  const handleQtyChange = (e) => {
    const v = e.target.value.replace(/[^\d]/g, "");
    if (v === "") {
      setQtyDraft("");
      return;
    }
    let n = parseInt(v, 10);
    if (Number.isNaN(n)) return;
    if (n > 999) n = 999;
    setQtyDraft(String(n));
  };

  const commitQty = async () => {
    if (!product || outOfStock) return;
    if (qtyDraft === "") {
      const fallback = qtyInCart || 1;
      setQtyDraft(String(clampInputQty(fallback)));
      return;
    }
    let n = parseInt(qtyDraft, 10);
    if (Number.isNaN(n)) {
      const fallback = qtyInCart || 1;
      setQtyDraft(String(clampInputQty(fallback)));
      return;
    }
    n = clampInputQty(n); // 1–999

    if (n !== qtyInCart) {
      try {
        haptic();
        await setQty(product.id, n);
      } catch (e) {
        console.error(e);
      }
    }
    setQtyDraft(String(n));
  };

  const handleQtyKeyDown = (e) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setQtyDraft(qtyInCart ? String(qtyInCart) : "1");
      e.currentTarget.blur();
    }
  };

  // если товар не найден
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

  const hasOld =
    typeof product.oldPrice === "number" && product.oldPrice > 0;

  const canInc = qtyInCart < 999;

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

          {/* Плашка предзаказа на фото — справа снизу */}
          {isPreorder && (
            <PreorderBadge>
              <img src={PREORDER_BADGE_SRC} alt="Предзаказ" />
            </PreorderBadge>
          )}

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
          <PriceWrap>
            <PriceNow $hasOld={hasOld}>
              {(product.price ?? 0).toLocaleString("ru-RU")} ₽
            </PriceNow>
            {hasOld && (
              <PriceOld>{product.oldPrice.toLocaleString("ru-RU")} ₽</PriceOld>
            )}
          </PriceWrap>

          {outOfStock ? (
            <OutOfStockBadge>Нет в наличии</OutOfStockBadge>
          ) : qtyInCart > 0 ? (
            <QtyBox>
              <QtyBtn
                {...makePointerPress(setDecPressed, doDec)}
                $pressed={decPressed}
                aria-label="Уменьшить количество"
              >
                <span className="btn-icon">–</span>
              </QtyBtn>

              <QtyInput
                type="tel"
                min={1}
                max={999}
                step={1}
                value={qtyDraft}
                onChange={handleQtyChange}
                onBlur={commitQty}
                onKeyDown={handleQtyKeyDown}
                inputMode="numeric"
                aria-label="Количество"
              />

              <QtyBtn
                {...makePointerPress(setIncPressed, doInc, !canInc)}
                $pressed={incPressed}
                aria-label="Увеличить количество"
                $disabled={!canInc}
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

        {/* выбор цвета, если есть варианты */}
        {colorVariants.length > 1 && (
          <ColorRow>
            <ColorLabel>Выбор цвета:</ColorLabel>
            <ColorDots>
              {colorVariants.map((v) => (
                <ColorDot
                  key={v.id}
                  $color={v.color?.hex || "#ffffff"}
                  $active={v.id === product.id}
                  onClick={() =>
                    v.id !== product.id && navigate(`/product/${v.id}`)
                  }
                  title={v.color?.name || v.name}
                />
              ))}
            </ColorDots>
          </ColorRow>
        )}

        {/* Жёлтый блок-плашка для предзаказа под выбором цвета */}
        {isPreorder && (
          <PreorderInfo>
            <PreorderInfoBg src={PREORDER_INFO_SRC} alt="" />
            <PreorderInfoContent>
              <PreorderInfoTitle>Внимание!</PreorderInfoTitle>
              <PreorderInfoText>
                Товар временно доступен только по предзаказу. Ориентировочный
                срок ожидания — до 30 дней. Перед оформлением заказа уточните
                точные сроки у менеджера{" "}
                <a
                  href="https://t.me/paradigma_hookah"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @paradigma_hookah
                </a>
                .
              </PreorderInfoText>
            </PreorderInfoContent>
          </PreorderInfo>
        )}

        {product.description && (
          <p style={{ margin: "8px 0 0", color: "#d6d6d6", lineHeight: 1.5 }}>
            {product.description}
          </p>
        )}

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
  font-family: "Montserrat", system-ui, -apple-system, Segoe UI, Roboto,
    sans-serif;
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

const PreorderBadge = styled.div`
  position: absolute;
  right: 10px;
  bottom: 10px;
  z-index: 3;
  img {
    display: block;
    max-width: 100px;
    height: auto;
  }
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
  background: ${(p) => (p.$active ? "#f5b300" : "rgba(255, 255, 255, 0.5)")};
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

const PriceWrap = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
`;

const PriceNow = styled.span`
  font-weight: 900;
  font-size: 24px;
  white-space: nowrap;
  color: ${(p) => (p.$hasOld ? "#ca3b34ff" : "#ffffff")};
`;

const PriceOld = styled.span`
  font-size: 21px;
  color: #a0a0a0;
  text-decoration: line-through;
  opacity: 0.9;
  white-space: nowrap;
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

const OutOfStockBadge = styled.div`
  height: ${COMMON_BUTTON_HEIGHT};
  min-width: 160px;
  border-radius: 10px;
  border: 2px solid #ff5252;
  background: #ff5252;
  color: #000;
  font-weight: 800;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const QtyBox = styled.div`
  height: ${COMMON_BUTTON_HEIGHT};
  display: grid;
  grid-template-columns: 40px minmax(56px, 80px) 40px;
  align-items: stretch;
  border: 2px solid #f5b300;
  background: #000;
  border-radius: 10px;
  padding: 0;
  min-width: 150px;
  max-width: 190px;
  box-sizing: border-box;
  overflow: hidden;
`;

const QtyBtn = styled.button`
  background: transparent;
  border: none;
  color: ${(p) => (p.$disabled ? "#777" : "#fff")};
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  cursor: ${(p) => (p.$disabled ? "default" : "pointer")};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 110ms ease-out, color 110ms ease-out,
    opacity 110ms.ease-out;
  transform: ${(p) => (p.$pressed ? "scale(.9)" : "scale(1)")};
  width: 100%;
  height: 100%;
  -webkit-tap-highlight-color: transparent;
  outline: none;
  touch-action: manipulation;
  opacity: ${(p) => (p.$disabled ? 0.4 : 1)};

  .btn-icon {
    pointer-events: none;
  }
`;

const QtyInput = styled.input`
  width: 100%;
  min-width: 0;
  height: 100%;
  background: transparent;
  border: none;
  color: #fff;
  font-weight: 800;
  font-size: 15px;
  text-align: center;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  box-sizing: border-box;
  padding: 0 4px;

  appearance: textfield;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    margin: 0;
  }
`;

/* выбор цвета */
const ColorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 2px 0 10px;
`;

const ColorLabel = styled.div`
  font-size: 13px;
  color: #ddd;
`;

const ColorDots = styled.div`
  display: flex;
  gap: 6px;
`;

const ColorDot = styled.button`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid ${(p) => (p.$active ? "#f5b300" : "#fff")};
  background: ${(p) => p.$color || "#ffffff"};
  cursor: pointer;
  padding: 0;
  box-sizing: border-box;
  outline: none;
`;

/* блок с информацией о предзаказе */
const PreorderInfo = styled.div`
  position: relative;
  margin: 24px 0 18px;
`;

const PreorderInfoBg = styled.img`
  width: 100%;
  display: block;
`;

const PreorderInfoContent = styled.div`
  position: absolute;
  inset: 10px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  pointer-events: none;
  padding-left: 64px;
  align-items: flex-start;

  a {
    pointer-events: auto;
    color: #0066ff;
    text-decoration: underline;
    font-weight: 700;
  }
`;

const PreorderInfoTitle = styled.div`
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 4px;
  color: #000;
`;

const PreorderInfoText = styled.div`
  font-size: 11px;
  line-height: 1.35;
  color: #000;
  font-weight: 700; /* делаем весь текст жирным */
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
