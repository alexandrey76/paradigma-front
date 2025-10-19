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

  const totalItems = useMemo(
    () => cart.reduce((total, item) => total + item.qty, 0),
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
        const serverItems = await fetchServerCart();
        
        // Преобразуем серверные товары в локальный формат
        const serverCartNormalized = serverItems.map(item => ({
          id: Number(item.product_key),
          name: item.name,
          price: Number(item.price) || 0,
          qty: Number(item.qty) || 0,
          images: item.meta?.images || [item.meta?.image].filter(Boolean),
        }));

        // Мердж корзин: приоритет у серверной версии
        const mergedMap = new Map();
        
        // Сначала добавляем серверные товары
        serverCartNormalized.forEach(item => {
          mergedMap.set(item.id, item);
        });
        
        // Затем добавляем локальные товары только если их нет на сервере
        cart.forEach(localItem => {
          if (!mergedMap.has(localItem.id)) {
            mergedMap.set(localItem.id, localItem);
          }
        });

        const merged = Array.from(mergedMap.values()).filter(item => item.qty > 0);
        setCart(merged);
        
      } catch (e) {
        console.warn("[cart] fetchServerCart failed:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Хелпер для безопасного вызова API
  async function safeApiCall(promise, label) {
    try {
      return await promise;
    } catch (e) {
      console.warn(`[cart:${label}] API call failed:`, e);
      return null;
    }
  }

  // Добавить товар (qty относительно текущего)
  async function addItem(product, inc = 1) {
    const id = Number(product?.id);
    if (!id || inc <= 0) return;

    // 1) Обновляем локальное состояние
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

    // 2) Синхронизируем с сервером
    const { tg_user_id } = getTgContext();
    if (!tg_user_id) return;

    await safeApiCall(
      addServerCartItem(product, inc),
      "addItem"
    );
  }

  // Установить абсолютное количество
  async function setQty(id, qty) {
    id = Number(id);
    qty = Number(qty);

    // 1) Обновляем локальное состояние
    setCart((prev) => {
      if (qty <= 0) return prev.filter((x) => x.id !== id);
      
      const idx = prev.findIndex((x) => x.id === id);
      if (idx === -1) {
        return [...prev, { id, name: "", price: 0, qty, images: [] }];
      } else {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty };
        return copy;
      }
    });

    // 2) Синхронизируем с сервером
    const { tg_user_id } = getTgContext();
    if (!tg_user_id) return;
    
    if (qty <= 0) {
      await safeApiCall(deleteServerCartItem(id), "delete");
    } else {
      await safeApiCall(updateServerCartQty(id, qty), "updateQty");
    }
  }

  // Удалить товар
  async function removeItem(id) {
    id = Number(id);

    // 1) Обновляем локальное состояние
    setCart((prev) => prev.filter((x) => x.id !== id));

    // 2) Синхронизируем с сервером
    const { tg_user_id } = getTgContext();
    if (!tg_user_id) return;
    
    await safeApiCall(deleteServerCartItem(id), "removeItem");
  }

  // Очистить корзину
  async function clearCart() {
    const { tg_user_id } = getTgContext();
    
    // 1) Очищаем локальное состояние
    setCart([]);
    
    // 2) Синхронизируем с сервером - удаляем все товары
    if (tg_user_id && cart.length > 0) {
      const deletePromises = cart.map(item =>
        safeApiCall(deleteServerCartItem(item.id), "clearCartItem")
      );
      await Promise.allSettled(deletePromises);
    }
  }

  // Получить количество конкретного товара
  function getItemQuantity(productId) {
    const item = cart.find(item => item.id === productId);
    return item ? item.qty : 0;
  }

  const value = useMemo(
    () => ({ 
      cart, 
      total, 
      totalItems,
      addItem, 
      setQty, 
      removeItem, 
      clearCart,
      getItemQuantity,
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