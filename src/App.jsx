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

/** -------- Preloader компонент -------- */
function Preloader({ videoSrc }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <video
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
}

/** -------- Telegram guard -------- */
function useTelegramGuard() {
  const { pathname } = useLocation();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    try {
      tg.ready();
      tg.expand();
      tg.disableVerticalSwipes();     // запрет сворачивания свайпом вниз
      tg.enableClosingConfirmation(); // запрос подтверждения при закрытии

      const onViewport = () => {
        if (!tg.isExpanded) tg.expand();
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

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000); // имитация загрузки
    return () => clearTimeout(timer);
  }, []);

  return (
    <CartProvider>
      <HashRouter>
        {loading ? (
          <Preloader videoSrc="/assets/video/Preloader.mp4" />
        ) : (
          <AppShell />
        )}
      </HashRouter>
    </CartProvider>
  );
}
