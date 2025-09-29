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

/* ====== Настройки прелоадера ====== */
const PRELOADER_VIDEO = "/assets/video/Preloader.mp4"; // положи файл в public/assets/video/
const SAFETY_TIMEOUT = 10000; // 10s запасной таймаут
const FADE_MS = 300; // длительность fade-out (мс)
const EXTRA_MS = 500; // небольшой запас перед fade (чтобы "чуть больше нужного")

/* ====== Компонент прелоадера (простой) ====== */
function Preloader({ videoSrc, onHidden }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!visible) {
      // запустим коллбек после окончания fade
      const t = setTimeout(() => {
        onHidden && onHidden();
      }, FADE_MS);
      return () => clearTimeout(t);
    }
  }, [visible, onHidden]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "#000", // можно поменять под тон видео
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transition: `opacity ${FADE_MS}ms ease`,
        opacity: visible ? 1 : 0,
        pointerEvents: "none",
      }}
      // дать доступ к изменению видимости извне через window (необязательно)
      data-preloader="true"
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

/* ====== Telegram guard (как было) ====== */
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <NavBar />
    </>
  );
}

/* ====== Основной App: показываем прелоадер, ждём загрузки, делаем fade-out ====== */
export default function App() {
  const [showPreloader, setShowPreloader] = useState(true);
  const [preloaderVisible, setPreloaderVisible] = useState(true);

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

    // Promise: шрифты (если поддерживается)
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();

    // safety timeout
    const safety = new Promise((resolve) => {
      timeoutId = setTimeout(resolve, SAFETY_TIMEOUT);
    });

    // ждём либо (load + fonts), либо safety
    Promise.race([
      Promise.all([waitLoad, fontsReady]),
      safety,
    ]).then(() => {
      if (!mounted) return;
      // дополнительный небольшой запас, как ты просил "чуть больше нужного"
      setTimeout(() => {
        // trigger fade-out
        setPreloaderVisible(false);
        // через FADE_MS скрываем совсем (unmount)
        setTimeout(() => {
          if (!mounted) return;
          setShowPreloader(false);
        }, FADE_MS);
      }, EXTRA_MS);
    });

    return () => {
      mounted = false;
      if (loadHandler) window.removeEventListener("load", loadHandler);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <CartProvider>
      <HashRouter>
        {showPreloader ? (
          <Preloader
            videoSrc={PRELOADER_VIDEO}
            onHidden={() => {
              /* onHidden вызывается после fade — но мы уже управляем hide в эффекте выше,
                 оставляем этот коллбек пустым (на случай, если нужен в будущем) */
            }}
          />
        ) : (
          <AppShell />
        )}
      </HashRouter>
    </CartProvider>
  );
}
