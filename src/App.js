import React, { useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import NavBar from "./components/NavBar";      // если используешь нижнюю навигацию
import GlobalStyle from "./styles/GlobalStyle"; // если есть глобальные стили

export default function App() {
  useEffect(() => {
    const tg = window?.Telegram?.WebApp;
    if (tg) {
      try {
        tg.ready();
        tg.expand(); // разворачиваем на всю высоту
        tg.disableVerticalSwipes?.(); // по желанию
      } catch (e) {
        console.warn("Telegram WebApp init warning:", e);
      }
    }
  }, []);

  return (
    <HashRouter>
      <GlobalStyle />
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <NavBar />
    </HashRouter>
  );
}
