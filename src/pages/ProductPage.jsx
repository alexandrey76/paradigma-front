// src/pages/ProductPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import products from "../data/products";
import { useCart } from "../context/CartContext";

const PUB = process.env.PUBLIC_URL || "";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  // хуки — всегда сверху
  const product = useMemo(
    () => products.find((p) => p.id === Number(id)),
    [id]
  );

  const media = useMemo(() => {
    const imgs = (product?.images || []).map((src) => ({ type: "image", src }));
    const vids = (product?.videos || []).map((mp4) => ({ type: "video", mp4 }));
    return [...imgs, ...vids];
  }, [product]);

  const [index, setIndex] = useState(0);
  const curr = media[index];

  // при смене товара — сбрасываем слайд
  useEffect(() => setIndex(0), [product]);

  const prev = () => setIndex((i) => (i - 1 + media.length) % media.length);
  const next = () => setIndex((i) => (i + 1) % media.length);

  // теперь ранний возврат ПОСЛЕ вызова хуков — это ок
  if (!product) {
    return <EmptyWrap>Товар не найден</EmptyWrap>;
  }

  const features = Array.isArray(product.features)
    ? product.features
    : (product.description || "")
        .split(/\r?\n|•|- |—|\. /)
        .map((s) => s.trim())
        .filter(Boolean);

  return (
    <FullBleed>
      <Page>
        <TopBar>
          <BackArrow aria-label="Назад" onClick={() => navigate(-1)}>
            <img
            src={`${process.env.PUBLIC_URL}/assets/images/backArrow.svg`}
            alt="Назад"
            />
          </BackArrow>
          <Brand>
            <Logo src={PUB + "/assets/images/paradigmaLogoo.svg"} alt="Paradigma" />
          </Brand>
          <TopCenter>
            <img src = "/assets/images/topLogo.svg" alt ="top logo" width="120px"/>
          </TopCenter>
        </TopBar>

        <Title>{product.name}</Title>
        <Bleed>
          <MediaBox>
            {media.length > 0 ? (
              curr.type === "image" ? (
                <Img src={curr.src} alt={product.name} />
              ) : (
                <Video key={curr.mp4} src={curr.mp4} controls playsInline preload="metadata" />
              )
            ) : (
              <NoPic />
            )}

            {media.length > 1 && (
              <>
                <NavArrow left aria-label="Назад" onClick={prev}>‹</NavArrow>
                <NavArrow aria-label="Вперёд" onClick={next}>›</NavArrow>
              </>
            )}
          </MediaBox>
        </Bleed> 
        <PriceRow>
          <Price>{(product.price ?? 0).toLocaleString("ru-RU")} ₽</Price>
          <AddBtn onClick={() => addItem(product)}>Добавить в корзину</AddBtn>
        </PriceRow>

        {features.length > 0 && (
          <SpecBlock>
            <SpecList>
              {features.map((f, i) => <li key={i}>{f}</li>)}
            </SpecList>
          </SpecBlock>
        )}
      </Page>
    </FullBleed>
  );
}

/* ===== styled (без изменений) ===== */

const FullBleed = styled.div`
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  background: #000;
`;
const Page = styled.main`
  padding: 12px var(--side-pad) calc(110px + env(safe-area-inset-bottom));
  min-height: 100dvh; color:#fff;
`;
const EmptyWrap = styled.div`
  min-height: 60vh; display:grid; place-items:center; color:#fff; background:#000;
`;

const TopBar = styled.header`
  background:#fff; color:#000; border-radius:10px; height:44px;
  display:grid; grid-template-columns:40px 1fr auto; align-items:center; gap:8px; padding:0 8px;
`;
const BackArrow = styled.button`
  display: flex;
  align-items: center;
  margin-right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  img {
    width: 14px;
    height: 14px;
  }
`;

const Brand = styled.div`display:flex;align-items:center;gap:8px;`;
const Logo = styled.img`height:18px;width:auto;`;
const TopCenter = styled.div`display:flex;align-items:left;gap:0px;`;
const TopLink = styled(Link)`color:inherit;text-decoration:none;font-size:18px;`;

const Bleed = styled.div`
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
`;

const Title = styled.h1`margin:14px 0 10px;font-size:18px;font-weight:800;`;

const MediaBox = styled.div`
  position: relative;
  width: 100vw;                /* ← весь viewport */
  max-width: 100vw;
  aspect-ratio: 1 / 1;         /* идеальный квадрат */
  border: 4px solid #f5b300;
  border-radius: 12px;
  overflow: hidden;
  background: #111;
  margin: 10px 0 22px;         /* отступы сверху/снизу, без боковых */
`;


const Img = styled.img`width:100%;height:100%;object-fit:cover;`;
const Video = styled.video`width:100%;height:100%;object-fit:cover;background:#000;`;
const NoPic = styled.div`width:100%;height:100%;background:#0f0f0f;`;
const NavArrow = styled.button`
  position:absolute; top:50%; transform:translateY(-50%);
  ${(p)=>p.left ? "left:-6px;" : "right:-6px;"}
  width:44px;height:44px;border-radius:50%;border:2px solid #fff;
  background:rgba(0,0,0,.5);color:#fff;font-size:26px;line-height:1;
`;

const PriceRow = styled.div`
  display:grid; grid-template-columns:1fr auto; gap:12px; align-items:center; margin:6px 0 14px;
  @media (max-width:360px){ grid-template-columns:1fr; }
`;
const Price = styled.div`font-weight:900;font-size:24px;`;
const AddBtn = styled.button`
  border:2px solid #f5b300; background:transparent; color:#fff; border-radius:10px;
  padding:10px 14px; font-weight:700;
`;
const SpecBlock = styled.section`margin-top:6px;`;
const SpecTitle = styled.div`margin-bottom:6px;font-weight:700;`;
const SpecList = styled.ul`margin:0;padding-left:18px;display:grid;gap:4px;li{color:#d6d6d6;}`;
