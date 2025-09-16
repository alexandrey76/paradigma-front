import React, { useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import NavBar from "./components/NavBar";      // если используешь нижнюю навигацию
import GlobalStyle from "./styles/GlobalStyle"; // если есть глобальные стили
import ProductPage from "./pages/ProductPage";
import { CartProvider } from "./context/CartContext";

export default function App() {
  useEffect(() => {
    const tg = window?.Telegram?.WebApp;
    if (tg) {
      try {
        tg.ready();
        tg.expand(); // разворачиваем на всю высот // по желанию
      } catch (e) {
        console.warn("Telegram WebApp init warning:", e);
      }
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <NavBar />
      </HashRouter>
    </CartProvider>
  );
}
