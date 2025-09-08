import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const LS_KEY = "cart.v1";

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // сохраняем корзину в localStorage
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(cart));
  }, [cart]);

  const addItem = (item, qty = 1) => {
    if (!item?.id) return;
    setCart(prev => {
      const idx = prev.findIndex(x => x.id === item.id);
      if (idx === -1) return [...prev, { ...item, qty }];
      const next = [...prev];
      next[idx] = { ...next[idx], qty: next[idx].qty + qty };
      return next;
    });
  };

  const removeItem = (id) => setCart(prev => prev.filter(x => x.id !== id));

  const setQty = (id, qty) =>
    setCart(prev =>
      prev.map(x => (x.id === id ? { ...x, qty: Math.max(1, qty) } : x))
    );

  const clearCart = () => setCart([]);

  const total = useMemo(
    () => cart.reduce((s, x) => s + x.price * x.qty, 0),
    [cart]
  );

  const value = { cart, addItem, removeItem, setQty, clearCart, total };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}