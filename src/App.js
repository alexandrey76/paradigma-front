// src/App.js
import { HashRouter as Router, Routes, Route } from "react-router-dom"; // или BrowserRouter
import { CartProvider } from "./context/CartContext";  // как у тебя сделано
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import NavBar from "./components/NavBar";
import FloatingBubble from "./components/FloatingBubble";

export default function App() {
  return (
    <CartProvider>
      <Router>
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
        </Routes>

        {/* глобальный поп-ап «Связаться» */}
        <FloatingBubble />
      </Router>
    </CartProvider>
  );
}
