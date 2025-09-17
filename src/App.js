// src/App.jsx
import React, { useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import GlobalStyle from "./styles/GlobalStyle";
import { CartProvider } from "./context/CartContext";

import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";

import NavBar from "./components/NavBar";

export default function App() {
  // Telegram WebApp авто-expand
  useEffect(() => {
    const tg = window?.Telegram?.WebApp;
    try {
      tg?.ready?.();
      tg?.expand?.();
    } catch {}
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
