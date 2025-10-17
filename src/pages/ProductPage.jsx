// src/pages/ProductPage.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import useEmblaCarousel from "embla-carousel-react";

import products from "../data/products";
import { useCart } from "../context/CartContext";
import { handleCartAction } from "../utils/cartApi";
import TopBar from "../components/TopBar";

const PUB = process.env.PUBLIC_URL || "";

export default function ProductPage() {
  const { id } = useParams();
  const { addItem } = useCart();

  const product = useMemo(
    () => products.find((p) => p.id === Number(id)),
    [id]
  );

  const media = useMemo(() => {
    if (!product) return [];
    const vids = (product.videos || []).map((mp4) => ({ type: "video", mp4 }));
    const imgs = (product.images || []).map((src) => ({ type: "image", src }));
    return [...vids, ...imgs];
  }, [product]);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    dragFree: false,
    align: "center",
    containScroll: "trimSnaps",
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

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

  useEffect(() => {
    setSelectedIndex(0);
    if (emblaApi) emblaApi.scrollTo(0, true);
  }, [id, emblaApi]);

  if (!product) return <EmptyWrap>Товар не найден</EmptyWrap>;

  const prev = () => emblaApi && emblaApi.scrollPrev();
  const next = () => emblaApi && emblaApi.scrollNext();

  const onAdd = async (prod) => {
    try {
      await handleCartAction("add", prod);
      addItem(prod, 1);
    } catch (e) {
      console.error(e);
      alert(`Не удалось добавить в корзину: ${e.message || e}`);
    }
  };

  return (
    <FullBleed>
      <Page>
        <TopBar svgSrc="./assets/images/topLogo.svg" />

        <Title>{product.name}</Title>

        {/* MEDIA: свайп-карусель */}
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
                        onTouchStart={(e) => e.stopPropagation()}
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
                <img
                  src={`${PUB}/assets/images/leftArrow.svg`}
                  alt="Назад"
                />
              </NavArrow>
              <NavArrow aria-label="Вперёд" onClick={next}>
                <img
                  src={`${PUB}/assets/images/rightArrow.svg`}
                  alt="Вперед"
                />
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
          <AddBtn onClick={() => onAdd(product)}>Добавить в корзину</AddBtn>
        </PriceRow>

        {product.description && (
          <SpecBlock>
            <SpecTitle>Набор:</SpecTitle>
            <SpecList>
              {product.description
                .split(/\r?\n|•|- |—/)
                .map((s) => s.trim())
                .filter(Boolean)
                .map((s, i) => (
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
  padding: 12px var(--side-pad) calc(110px + env(safe-area-inset-bottom));
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
  max-width: calc(100% - 20px);
  margin: 8px auto 18px;
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
  border: 2px solid #f5b300;
  background: #f5b300;
  color: #000;
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.2s ease, color 0.2s ease;

  &:active {
    transform: scale(0.95);
  }
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
