// src/App.jsx
import React, { useEffect, useState, useRef } from "react"; // ★ NEW: useRef
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { CartProvider, useCart } from "./context/CartContext"; // ★ NEW: useCart
import GlobalStyle from "./styles/GlobalStyle";

import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import NavBar from "./components/NavBar";
import SupportPage from "./pages/SupportPage";
import ProfilePage from "./pages/ProfilePage";
import AgeGate from "./components/AgeGate";
import PrivacyPage from "./pages/PrivacPage";
import ConsentPage from "./pages/ConsentPage";
import { ensureUserOnServer } from "./api/userApi"; // ★ NEW

/* ====== Настройки прелоадера ====== */
const PRELOADER_VIDEO = "/assets/video/Preloader.mp4";
const SAFETY_TIMEOUT = 10000;
const FADE_MS = 500;
const MINIMUM_DISPLAY_TIME = 1500;
const EXTRA_DELAY = 800;

/* ====== Компонент прелоадера (локально) ====== */
function PreloaderOverlay({ videoSrc, fadeOut, onTransitionEnd }) {
  return (
    <div
      aria-hidden="true"
      onTransitionEnd={onTransitionEnd}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "#000",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transition: `opacity ${FADE_MS}ms ease-out, visibility ${FADE_MS}ms`,
        opacity: fadeOut ? 0 : 1,
        visibility: fadeOut ? "hidden" : "visible",
        pointerEvents: fadeOut ? "none" : "auto",
      }}
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
          object-fit: "cover",
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
      if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
      if (tg.enableClosingConfirmation) tg.enableClosingConfirmation();

      const onViewport = () => {
        if (!tg.isExpanded && tg.expand) tg.expand();
      };
      tg.onEvent?.("viewportChanged", onViewport);
      return () => tg.offEvent?.("viewportChanged", onViewport);
    } catch (e) {
      console.warn("Telegram WebApp init error:", e);
    }
  }, [pathname]);
}

/* ====== Shell с маршрутизацией ====== */
function AppShell() {
  useTelegramGuard();
  const location = useLocation();
  const { syncCart } = useCart(); // ★ NEW: получаем функцию синхронизации корзины

  const NAVBAR_HEIGHT = 64;
  const noNavBarPages = ["/privacy-policy", "/consent"];
  const showNavBar = !noNavBarPages.includes(location.pathname);

  // ★ NEW: авторегистрация пользователя на сервере (один раз)
  const ensuredRef = useRef(false);
  useEffect(() => {
    if (ensuredRef.current) return;

    const tg = window?.Telegram?.WebApp;
    const initData = tg?.initData;
    if (!initData) {
      // Открыли вне Telegram — молча пропускаем
      ensuredRef.current = true;
      return;
    }

    ensureUserOnServer()
      .catch((e) => console.warn("ensureUser error:", e?.message || e))
      .finally(() => {
        ensuredRef.current = true;
      });
  }, []);

  // ★ NEW: синхронизируем корзину с сервером при каждом запуске приложения
  useEffect(() => {
    const syncCartOnStart = async () => {
      const tg = window?.Telegram?.WebApp;
      const initData = tg?.initData;
      
      if (initData) {
        // Только если пользователь в Telegram - синхронизируем корзину
        console.log("🔄 Syncing cart with server on app start...");
        await syncCart();
      }
    };

    syncCartOnStart();
  }, [syncCart]);

  return (
    <>
      <GlobalStyle />
      <div
        style={{
          minHeight: "100svh",
          paddingBottom: showNavBar ? `calc(${NAVBAR_HEIGHT}px + env(safe-area-inset-bottom))` : "0",
          boxSizing: "border-box",
          background: "#000",
        }}
      >
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/privacy-policy" element={<PrivacyPage />} />
          <Route path="/consent" element={<ConsentPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {showNavBar && <NavBar />}
    </>
  );
}

/* ====== Главный App ====== */
export default function App() {
  const [showPreloader, setShowPreloader] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [startTime] = useState(Date.now());

  // Age gate
  const [ageOpen, setAgeOpen] = useState(false);

  useEffect(() => {
    try {
      const ok = localStorage.getItem("age_verified") === "1";
      if (!ok) setAgeOpen(true);
    } catch {
      setAgeOpen(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let loadHandler = null;
    let timeoutId = null;

    const waitLoad = new Promise((resolve) => {
      if (document.readyState === "complete") {
        resolve();
        return;
      }
      loadHandler = () => resolve();
      window.addEventListener("load", loadHandler, { passive: true });
    });

    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();

    const safety = new Promise((resolve) => {
      timeoutId = setTimeout(resolve, SAFETY_TIMEOUT);
    });

    Promise.race([Promise.all([waitLoad, fontsReady]), safety]).then(() => {
      if (!mounted) return;

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MINIMUM_DISPLAY_TIME - elapsedTime);
      const totalDelay = remainingTime + EXTRA_DELAY;

      timeoutId = setTimeout(() => {
        if (!mounted) return;
        setFadeOut(true);
      }, totalDelay);
    });

    return () => {
      mounted = false;
      if (loadHandler) window.removeEventListener("load", loadHandler);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [startTime]);

  const handlePreloaderTransitionEnd = () => {
    if (fadeOut) {
      setShowPreloader(false);
    }
  };

  const handleAgeClose = () => {
    try {
      localStorage.setItem("age_verified", "1");
    } catch {}
    setAgeOpen(false);
  };

  return (
    <CartProvider>
      <HashRouter>
        <AppShell />

        {/* Age gate поверх всего (если открыт) */}
        <AgeGate open={ageOpen} onClose={handleAgeClose} />

        {/* Прелоадер поверх контента */}
        {showPreloader && (
          <PreloaderOverlay
            videoSrc={PRELOADER_VIDEO}
            fadeOut={fadeOut}
            onTransitionEnd={handlePreloaderTransitionEnd}
          />
        )}
      </HashRouter>
    </CartProvider>
  );
}