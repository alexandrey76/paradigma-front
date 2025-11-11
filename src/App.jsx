// src/App.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import GlobalStyle from "./styles/GlobalStyle";

import OrdersPage from "./pages/OrdersPage";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import NavBar from "./components/NavBar";
import SupportPage from "./pages/SupportPage";
import ProfilePage from "./pages/ProfilePage";
import AgeGate from "./components/AgeGate";
import PrivacyPage from "./pages/PrivacPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import ConsentPage from "./pages/ConsentPage";
import { ensureUserOnServer } from "./api/userApi";

/* ====== версия фронта ====== */
const BUILD_VERSION = "2025-11-11-02";

/* ====== AgeGate настройки ====== */
const AGE_KEY = "age_gate_last_pass";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;


const AGEGATE_FORCE_ALWAYS = false;

/* ====== Настройки прелоадера ====== */
const PRELOADER_VIDEO = "/assets/video/Preloader.mp4";
const SAFETY_TIMEOUT = 10000;
const FADE_MS = 500;
const MINIMUM_DISPLAY_TIME = 1500;
const EXTRA_DELAY = 800;

/* ====== Прелоадер ====== */
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
          objectFit: "cover",
          background: "transparent",
        }}
      />
    </div>
  );
}

/* ====== Сброс скролла ====== */
function ScrollReset() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        const html = document.documentElement;
        const body = document.body;
        const prevHtml = html.style.scrollBehavior;
        const prevBody = body.style.scrollBehavior;
        html.style.scrollBehavior = "auto";
        body.style.scrollBehavior = "auto";
        el.scrollIntoView();
        requestAnimationFrame(() => {
          html.style.scrollBehavior = prevHtml;
          body.style.scrollBehavior = prevBody;
        });
        return;
      }
    }
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.scrollBehavior;
    const prevBody = body.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    body.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    const id = requestAnimationFrame(() => {
      html.style.scrollBehavior = prevHtml;
      body.style.scrollBehavior = prevBody;
    });
    return () => cancelAnimationFrame(id);
  }, [pathname, hash]);
  return null;
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
      const onViewport = () => !tg.isExpanded && tg.expand?.();
      tg.onEvent?.("viewportChanged", onViewport);
      return () => tg.offEvent?.("viewportChanged", onViewport);
    } catch (e) {
      console.warn("Telegram WebApp init error:", e);
    }
  }, [pathname]);
}

/* ====== Shell ====== */
function AppShell() {
  useTelegramGuard();
  const location = useLocation();

  const NAVBAR_HEIGHT = 64;
  const noNavBarPages = ["/privacy-policy", "/consent"];
  const showNavBar = !noNavBarPages.includes(location.pathname);

  // авторегистрация пользователя на сервере (один раз)
  const ensuredRef = useRef(false);
  useEffect(() => {
    if (ensuredRef.current) return;
    const tg = window?.Telegram?.WebApp;
    const initData = tg?.initData;
    if (!initData) {
      ensuredRef.current = true;
      return;
    }
    ensureUserOnServer()
      .catch((e) => console.warn("ensureUser error:", e?.message || e))
      .finally(() => {
        ensuredRef.current = true;
      });
  }, []);

  return (
    <>
      <GlobalStyle />
      <div
        style={{
          minHeight: "100svh",
          paddingBottom: showNavBar
            ? `calc(${NAVBAR_HEIGHT}px + env(safe-area-inset-bottom))`
            : "0",
          boxSizing: "border-box",
          background: "#000",
        }}
      >
        <ScrollReset />
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
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/order/:id" element={<OrderDetailsPage />} />
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
    // тестовый режим — всегда показываем
    if (AGEGATE_FORCE_ALWAYS) {
      try {
        localStorage.removeItem(AGE_KEY);
        localStorage.removeItem("age_verified");
      } catch {}
      setAgeOpen(true);
      return;
    }

    // прод-режим — раз в неделю
    try {
      const raw = localStorage.getItem(AGE_KEY);
      const now = Date.now();
      if (!raw) {
        setAgeOpen(true);
      } else {
        const ts = Number(raw);
        if (!Number.isFinite(ts) || now - ts > WEEK_MS) {
          setAgeOpen(true);
        } else {
          setAgeOpen(false);
        }
      }
    } catch {
      setAgeOpen(true);
    }
  }, []);

  // ====== АВТООБНОВЛЕНИЕ ПО ВЕРСИИ ======
  useEffect(() => {
    let timerId;

    const checkVersion = async () => {
      try {
        const base = process.env.PUBLIC_URL || "";
        const res = await fetch(`${base}/version.json?ts=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const serverVersion = data?.version;
        if (serverVersion && serverVersion !== BUILD_VERSION) {
          window.location.reload(true);
        }
      } catch (e) {
        // молчим
      }
    };

    checkVersion();
    timerId = setInterval(checkVersion, 30000);

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, []);

  // Прелоадер
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
    if (fadeOut) setShowPreloader(false);
  };

  // подтвердил возраст
  const handleAgeClose = () => {
    try {
      localStorage.setItem(AGE_KEY, String(Date.now()));
    } catch {}
    setAgeOpen(false);
  };

  return (
    <CartProvider>
      <HashRouter>
        <AppShell />

        {/* Age gate поверх всего */}
        <AgeGate open={ageOpen} onClose={handleAgeClose} persist={false} />

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
