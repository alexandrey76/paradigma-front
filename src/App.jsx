// src/App.jsx
import React, { useEffect, useState } from "react";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import GlobalStyle from "./styles/GlobalStyle";

import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import NavBar from "./components/NavBar";
import SupportPage from "./pages/SupportPage";
import ProfilePage from "./pages/ProfilePage";

/* ====== Настройки прелоадера ====== */
const PRELOADER_VIDEO = "/assets/video/Preloader.mp4";
const SAFETY_TIMEOUT = 10000;
const FADE_MS = 500;
const MINIMUM_DISPLAY_TIME = 1500;
const EXTRA_DELAY = 800;

/* ====== Компонент прелоадера ====== */
function Preloader({ videoSrc, onFadeComplete, fadeOut }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "#000",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transition: `opacity ${FADE_MS}ms ease-out`,
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? "none" : "auto",
      }}
      onTransitionEnd={onFadeComplete}
    >
      <video
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          background: "transparent",
        }}
      />
    </div>
  );
}

/* ====== Telegram guard ====== */
function useTelegramGuard() {
  const { pathname } = useLocation();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    try {
      tg.ready?.();
      tg.expand?.();
      tg.disableVerticalSwipes?.();
      tg.enableClosingConfirmation?.();

      const onViewport = () => {
        if (!tg.isExpanded) tg.expand?.();
      };
      tg.onEvent?.("viewportChanged", onViewport);
      return () => tg.offEvent?.("viewportChanged", onViewport);
    } catch (e) {
      console.warn("Telegram WebApp init error:", e);
    }
  }, [pathname]);
}

function AppShell() {
  useTelegramGuard();

  return (
    <>
      <GlobalStyle />
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <NavBar />
    </>
  );
}

export default function App() {
  const [showPreloader, setShowPreloader] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    let mounted = true;
    let loadHandler = null;
    let timeoutId = null;

    // Promise: ждём window.load
    const waitLoad = new Promise((resolve) => {
      if (document.readyState === "complete") {
        resolve();
        return;
      }
      loadHandler = () => resolve();
      window.addEventListener("load", loadHandler, { passive: true });
    });

    // Promise: шрифты
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();

    // safety timeout
    const safety = new Promise((resolve) => {
      timeoutId = setTimeout(resolve, SAFETY_TIMEOUT);
    });

    // Ждём загрузки контента
    Promise.race([
      Promise.all([waitLoad, fontsReady]),
      safety,
    ]).then(() => {
      if (!mounted) return;
      setContentLoaded(true);

      // Вычисляем, сколько времени уже прошло
      const elapsedTime = Date.now() - startTime;
      
      // Если прошло меньше минимального времени, ждём остаток
      const remainingTime = Math.max(0, MINIMUM_DISPLAY_TIME - elapsedTime);
      
      // Добавляем дополнительную задержку
      const totalDelay = remainingTime + EXTRA_DELAY;

      console.log(`Preloader timing: elapsed ${elapsedTime}ms, waiting ${totalDelay}ms more`);

      setTimeout(() => {
        if (!mounted) return;
        // Запускаем fade-out
        setFadeOut(true);
      }, totalDelay);
    });

    return () => {
      mounted = false;
      if (loadHandler) window.removeEventListener("load", loadHandler);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [startTime]);

  const handleFadeComplete = () => {
    if (fadeOut) {
      setShowPreloader(false);
    }
  };

  return (
    <CartProvider>
      <HashRouter>
        {/* AppShell показывается всегда, но может быть под прелоадером */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          opacity: contentLoaded ? 1 : 0,
          transition: contentLoaded ? `opacity ${FADE_MS}ms ease-out` : 'none'
        }}>
          <AppShell />
        </div>
        
        {/* Прелоадер поверх контента */}
        {showPreloader && (
          <Preloader
            videoSrc={PRELOADER_VIDEO}
            fadeOut={fadeOut}
            onFadeComplete={handleFadeComplete}
          />
        )}
      </HashRouter>
    </CartProvider>
  );
}