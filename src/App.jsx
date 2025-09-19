// src/App.jsx
import React, { useEffect } from "react";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SDKProvider, useWebApp } from "@telegram-apps/sdk-react";

import { CartProvider } from "./context/CartContext";
import GlobalStyle from "./styles/GlobalStyle";

import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import NavBar from "./components/NavBar";

/** Повторно применяем настройки TG WebApp (expand/disable swipes) — через SDK */
function useTelegramGuardSDK() {
  const { pathname } = useLocation();
  const webApp = useWebApp();

  useEffect(() => {
    if (!webApp) return;

    try {
      // Сообщаем, что приложение готово, разворачиваем и запрещаем сворачивание свайпом
      webApp.ready();
      webApp.expand();
      webApp.disableVerticalSwipes?.();
      webApp.enableClosingConfirmation?.();

      // Если по какой-то причине свернулось — разворачиваем обратно
      const onViewportChanged = () => {
        if (!webApp.isExpanded) webApp.expand();
      };

      webApp.onEvent?.("viewportChanged", onViewportChanged);
      return () => webApp.offEvent?.("viewportChanged", onViewportChanged);
    } catch (e) {
      console.warn("Telegram WebApp init error (SDK):", e);
    }
  }, [webApp, pathname]);
}

function AppShell() {
  useTelegramGuardSDK();

  return (
    <>
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
    </>
  );
}

export default function App() {
  return (
    <SDKProvider acceptCustomStyles debug>
      <CartProvider>
        <HashRouter>
          <AppShell />
        </HashRouter>
      </CartProvider>
    </SDKProvider>
  );
}
