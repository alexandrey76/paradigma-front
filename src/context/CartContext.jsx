// src/context/CartContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getTgContext,
  fetchServerCart,
  addServerCartItem,
  updateServerCartQty,
  deleteServerCartItem,
} from "../api/cartApi";

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
        const serverItems = await fetchServerCart(tg_user_id);
        
        // Простое мердж-правило: если один и тот же product_key есть локально и на сервере —
        // берём максимум qty
        const map = new Map();
        
        // Добавляем серверные товары
        for (const it of serverItems) {
          map.set(String(it.product_key), {
            id: Number(it.product_key),
            name: it.name,
            price: Number(it.price) || 0,
            qty: Number(it.qty) || 0,
            images: it.meta?.images || [it.meta?.image].filter(Boolean),
          });
        }
        
        // Добавляем локальные товары (если их нет на сервере или qty больше)
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
        
        // Синхронизируем объединенную корзину на сервер
        if (merged.length > 0) {
          await syncCartToServer(tg_user_id, merged);
        }
        
      } catch (e) {
        console.warn("[cart] fetchServerCart failed:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Синхронизация всей корзины на сервер
  async function syncCartToServer(tg_user_id, cartItems) {
    try {
      await fetch('/api/cart/update-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tg_user_id,
          items: cartItems.map(item => ({
            product_key: String(item.id),
            name: item.name,
            price: Number(item.price) || 0,
            qty: Number(item.qty) || 0,
            meta: { 
              images: item.images || [],
              image: item.images?.[0] || null
            }
          }))
        })
      });
    } catch (e) {
      console.warn("[cart] syncCartToServer failed:", e);
    }
  }

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
        return [...prev, { 
          id, 
          name: product.name, 
          price: product.price || 0, 
          qty: inc, 
          images: product.images || [] 
        }];
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
      fetch('/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tg_user_id,
          product_id: String(id),
          name: product.name,
          price: Number(product.price) || 0,
          image: product.images?.[0] || null,
          delta: inc
        })
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
    
    await safeCall(
      fetch('/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tg_user_id,
          product_id: String(id),
          set_qty: qty
        })
      }),
      "setQty"
    );
  }

  // Удалить
  async function removeItem(id) {
    id = Number(id);

    // 1) локально
    setCart((prev) => prev.filter((x) => x.id !== id));

    // 2) сервер
    const { tg_user_id } = getTgContext();
    if (!tg_user_id) return;
    
    await safeCall(
      fetch('/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tg_user_id,
          product_id: String(id),
          set_qty: 0
        })
      }),
      "remove"
    );
  }

  // Очистить корзину
  async function clearCart() {
    const { tg_user_id } = getTgContext();
    
    // локально
    setCart([]);
    
    // на сервере — удаляем все товары
    if (tg_user_id && cart.length) {
      const ops = cart.map((it) =>
        safeCall(
          fetch('/api/cart/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tg_user_id,
              product_id: String(it.id),
              set_qty: 0
            })
          }),
          "clearItem"
        )
      );
      await Promise.allSettled(ops);
    }
  }

  // Получить количество конкретного товара
  function getItemQuantity(productId) {
    const item = cart.find(item => item.id === productId);
    return item ? item.qty : 0;
  }

  // Получить общее количество товаров в корзине
  const totalItems = useMemo(
    () => cart.reduce((total, item) => total + item.qty, 0),
    [cart]
  );

  const value = useMemo(
    () => ({ 
      cart, 
      total, 
      totalItems,
      addItem, 
      setQty, 
      removeItem, 
      clearCart,
      getItemQuantity
    }),
    [cart, total, totalItems]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}