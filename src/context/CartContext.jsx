// src/context/CartContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../api/client";

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

function getTelegramUser() {
  const tg = window?.Telegram?.WebApp;
  return {
    tg,
    tg_user_id: tg?.initDataUnsafe?.user?.id || null,
    tg_username: tg?.initDataUnsafe?.user?.username || null,
    tg_first_name: tg?.initDataUnsafe?.user?.first_name || null,
  };
}

export function CartProvider({ children }) {
  const { tg, tg_user_id, tg_username, tg_first_name } = getTelegramUser();

  // Telegram UI готовность (не обязательно, но полезно)
  useEffect(() => {
    try {
      tg?.ready?.();
    } catch {}
  }, [tg]);

  const [items, setItems] = useState([]); // [{product_key,name,price,qty,meta,added_at}]
  const [loading, setLoading] = useState(Boolean(tg_user_id));
  const [error, setError] = useState("");

  // загрузка корзины при монтировании/смене пользователя
  useEffect(() => {
    if (!tg_user_id) return;
    (async () => {
      try {
        setLoading(true);
        const data = await api.getCart(tg_user_id);
        setItems(data.items || []);
        setError("");
      } catch (e) {
        setError(e.message || "Не удалось загрузить корзину");
      } finally {
        setLoading(false);
      }
    })();
  }, [tg_user_id]);

  // добавить/увеличить qty
  const addItem = async (product, qty = 1, meta = {}) => {
    if (!tg_user_id || !product) return;
    await api.addCartItem({
      tg_user_id,
      product_key: String(product.id), // ВАЖНО: стабильный ключ (id/sku/slug)
      name: product.name,
      price: Number(product.price),
      qty: Number(qty),
      meta: { image: product.image, ...meta },
    });
    const data = await api.getCart(tg_user_id);
    setItems(data.items || []);
  };

  // установить точное количество (qty<=0 удаляет позицию)
  const setQty = async (product_key, qty) => {
    if (!tg_user_id) return;
    await api.setCartItemQty({
      tg_user_id,
      product_key: String(product_key),
      qty: Number(qty),
    });
    const data = await api.getCart(tg_user_id);
    setItems(data.items || []);
  };

  // удалить одну позицию
  const removeItem = async (product_key) => {
    if (!tg_user_id) return;
    await api.removeCartItem(tg_user_id, String(product_key));
    setItems((prev) => prev.filter((x) => String(x.product_key) !== String(product_key)));
  };

  // очистить корзину
  const clearCart = async () => {
    if (!tg_user_id) return;
    await api.clearCart(tg_user_id);
    setItems([]);
  };

  const total = useMemo(
    () => items.reduce((s, x) => s + Number(x.price) * Number(x.qty), 0),
    [items]
  );

  const value = {
    items,
    total,
    loading,
    error,
    addItem,
    setQty,
    removeItem,
    clearCart,
    tg_user_id,
    tg_username,
    tg_first_name,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
