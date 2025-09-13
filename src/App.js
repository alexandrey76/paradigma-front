import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import GlobalStyle from "./styles/GlobalStyle";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import NavBar from "./components/NavBar";
import React, { useEffect } from "react";

export default function App() {
   useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();   // сообщает Telegram, что всё готово
      tg.expand();  // сразу развернуть на максимум
    }
  }, []);
  return (
    <HashRouter>
      <GlobalStyle />   {/* ← глобальный фон и сбросы работают на всех страницах */}

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
