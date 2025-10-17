// src/context/CartContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getTgContext,
  fetchServerCart,
  addServerCartItem,
  updateServerCartQty,
  deleteServerCartItem,
} from "../api/cart";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem("cart_v1") || "[]";
      return JSON.parse(raw);
    } catch {
      return [];
    }
  });

  const total = useMemo(
    () => cart.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0),
    [cart]
  );

  // Сохраняем локально для оффлайна
  useEffect(() => {
    localStorage.setItem("cart_v1", JSON.stringify(cart));
  }, [cart]);

  // При старте — стянуть корзину с сервера и слить её с локальной
  useEffect(() => {
    const { tg_user_id } = getTgContext();
    if (!tg_user_id) {
      console.info("[cart] no tg_user_id — работаем только локально");
      return;
    }
    (async () => {
      try {
        const srv = await fetchServerCart(tg_user_id);
        const serverItems = Array.isArray(srv?.items) ? srv.items : [];
        // Простое мердж-правило: если один и тот же product_key есть локально и на сервере —
        // берём максимум qty (можно заменить на серверную версию или суммирование)
        const map = new Map();
        for (const it of serverItems) {
          map.set(String(it.product_key), {
            id: Number(it.product_key),
            name: it.name,
            price: Number(it.price) || 0,
            qty: Number(it.qty) || 0,
            images: it.meta?.images || [],
          });
        }
        for (const it of cart) {
          const key = String(it.id);
          if (!map.has(key)) {
            map.set(key, { ...it });
          } else {
            const cur = map.get(key);
            map.set(key, { ...cur, qty: Math.max(cur.qty, it.qty) });
          }
        }
        const merged = Array.from(map.values()).filter((x) => x.qty > 0);
        setCart(merged);
      } catch (e) {
        console.warn("[cart] fetchServerCart failed:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Хелпер для записи на сервер (тихо, без падений UI)
  async function safeCall(promise, label) {
    try {
      return await promise;
    } catch (e) {
      console.warn(`[cart:${label}] server call failed:`, e);
      return null;
    }
  }

  // Добавить товар (qty относительно текущего)
  async function addItem(product, inc = 1) {
    const id = Number(product?.id);
    if (!id || inc <= 0) return;

    // 1) локально
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx === -1) {
        return [...prev, { id, name: product.name, price: product.price || 0, qty: inc, images: product.images || [] }];
      } else {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + inc };
        return copy;
      }
    });

    // 2) сервер
    const { tg_user_id } = getTgContext();
    if (!tg_user_id) return; // вне Telegram — просто локально
    await safeCall(
      addServerCartItem({
        tg_user_id,
        product_key: String(id),
        name: product.name,
        price: Number(product.price) || 0,
        qty: inc,
        meta: { images: product.images || [] },
      }),
      "add"
    );
  }

  // Установить абсолютное количество
  async function setQty(id, qty) {
    id = Number(id);
    qty = Number(qty);

    // 1) локально
    setCart((prev) => {
      if (qty <= 0) return prev.filter((x) => x.id !== id);
      const idx = prev.findIndex((x) => x.id === id);
      if (idx === -1) {
        return [...prev, { id, name: "", price: 0, qty }];
      } else {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty };
        return copy;
      }
    });

    // 2) сервер
    const { tg_user_id } = getTgContext();
    if (!tg_user_id) return;
    if (qty <= 0) {
      await safeCall(deleteServerCartItem({ tg_user_id, product_key: String(id) }), "delete");
    } else {
      await safeCall(updateServerCartQty({ tg_user_id, product_key: String(id), qty }), "updateQty");
    }
  }

  // Удалить
  async function removeItem(id) {
    id = Number(id);

    // 1) локально
    setCart((prev) => prev.filter((x) => x.id !== id));

    // 2) сервер
    const { tg_user_id } = getTgContext();
    if (!tg_user_id) return;
    await safeCall(deleteServerCartItem({ tg_user_id, product_key: String(id) }), "delete");
  }

  // Очистить корзину
  async function clearCart() {
    const { tg_user_id } = getTgContext();
    // локально
    setCart([]);
    // на сервере — пробежимся по текущему снапшоту и удалим
    if (tg_user_id && cart.length) {
      const ops = cart.map((it) =>
        safeCall(deleteServerCartItem({ tg_user_id, product_key: String(it.id) }), "deleteAll")
      );
      await Promise.allSettled(ops);
    }
  }

  const value = useMemo(
    () => ({ cart, total, addItem, setQty, removeItem, clearCart }),
    [cart, total]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
