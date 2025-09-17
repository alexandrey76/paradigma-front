import React, { useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import GlobalStyle from "./styles/GlobalStyle";

import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import NavBar from "./components/NavBar";

export default function App() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    try {
      // базовая инициализация
      tg.ready();
      tg.expand();

      // отключаем сворачивание по свайпу вниз (если доступно)
      tg.disableVerticalSwipes?.();

      // подтверждение при закрытии, чтобы случайно не выйти
      tg.enableClosingConfirmation?.();

      // если высота меняется (клава/жесты) — держим развёрнутым
      const onViewport = () => {
        if (!tg.isExpanded) tg.expand();
      };
      tg.onEvent?.("viewportChanged", onViewport);

      return () => tg.offEvent?.("viewportChanged", onViewport);
    } catch (e) {
      console.warn("Telegram WebApp init error:", e);
    }
  }, []);

  return (
    <CartProvider>
      <HashRouter>
        <GlobalStyle />
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <NavBar />
      </HashRouter>
    </CartProvider>
  );
}
