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

/** ================= Прелоадер ================= */
function Preloader() {
  return (
    <div style={styles.wrap}>
      <video
        autoPlay
        loop
        muted
        playsInline
        style={styles.video}
      >
        <source src="/assets/video/Preloader.mp4" type="video/mp4" />
      </video>
    </div>
  );
}

const styles = {
  wrap: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "#000",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
};

/** Повторно применяем настройки TG WebApp (expand/disable swipes) */
function useTelegramGuard() {
  const { pathname } = useLocation();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    try {
      tg.ready();
      tg.expand();
      tg.disableVerticalSwipes();     // запрет сворачивания свайпом вниз
      tg.enableClosingConfirmation();  // запрос подтверждения при закрытии

      const onViewport = () => {
        if (!tg.isExpanded) tg.expand();
      };
      tg.onEvent?.("viewportChanged", onViewport);
      return () => tg.offEvent?.("viewportChanged", onViewport);
    } catch (e) {
      console.warn("Telegram WebApp init error:", e);
    }
  }, [pathname]); // 👈 повторяем на каждом роуте
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

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // имитация загрузки: убираем прелоадер через 2 сек
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <CartProvider>
      <HashRouter>
        {loading ? <Preloader /> : <AppShell />}
      </HashRouter>
    </CartProvider>
  );
}
