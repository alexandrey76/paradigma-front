// src/context/CartContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getTgContext,
  fetchServerCart,
  addServerCartItem,
  updateServerCartQty,
  deleteServerCartItem,
} from "../api/cartApi";
import products from "../data/products"; // ★ NEW: импортируем продукты

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ★ NEW: функция для получения данных товара по ID
  const getProductById = (productId) => {
    return products.find(product => product.id === productId);
  };

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

  // ПРИ СТАРТЕ — всегда стянуть корзину с сервера
  useEffect(() => {
    const loadCartFromServer = async () => {
      const { tg_user_id } = getTgContext();
      
      if (!tg_user_id) {
        console.info("[cart] no tg_user_id — работаем только локально");
        setIsLoading(false);
        return;
      }
      
      try {
        console.log("[cart] Loading cart from server for user:", tg_user_id);
        const serverItems = await fetchServerCart();
        
        // ★ UPDATED: Обогащаем данные товарами из products.js
        const serverCartNormalized = serverItems.map(serverItem => {
          const productId = Number(serverItem.product_key);
          const productData = getProductById(productId);
          
          return {
            id: productId,
            name: productData?.name || serverItem.name || `Товар ${productId}`,
            price: Number(productData?.price) || Number(serverItem.price) || 0,
            qty: Number(serverItem.qty) || 0,
            images: productData?.images || [serverItem.meta?.image].filter(Boolean) || [],
            description: productData?.description || "",
          };
        });

        console.log("[cart] Server cart loaded:", serverCartNormalized.length, "items");
        setCart(serverCartNormalized);
        
      } catch (e) {
        console.warn("[cart] fetchServerCart failed:", e);
        // Если не удалось загрузить с сервера, пробуем загрузить из localStorage
        try {
          const localCart = localStorage.getItem("cart_v1");
          if (localCart) {
            const parsed = JSON.parse(localCart);
            // ★ UPDATED: Обогащаем и локальные данные
            const enrichedLocalCart = parsed.map(item => {
              const productData = getProductById(item.id);
              return {
                ...item,
                name: productData?.name || item.name,
                price: Number(productData?.price) || Number(item.price) || 0,
                images: productData?.images || item.images || [],
                description: productData?.description || item.description || "",
              };
            });
            setCart(Array.isArray(enrichedLocalCart) ? enrichedLocalCart : []);
          }
        } catch (localError) {
          console.warn("[cart] Local storage load failed:", localError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadCartFromServer();
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

    // ★ UPDATED: Получаем полные данные товара
    const productData = getProductById(id) || product;

    // 1) Обновляем локальное состояние
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx === -1) {
        return [...prev, { 
          id, 
          name: productData.name, 
          price: productData.price || 0, 
          qty: inc, 
          images: productData.images || [],
          description: productData.description || "",
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
      addServerCartItem(productData, inc),
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
        // ★ UPDATED: Получаем данные товара при добавлении
        const productData = getProductById(id);
        return [...prev, { 
          id, 
          name: productData?.name || "", 
          price: productData?.price || 0, 
          qty, 
          images: productData?.images || [],
          description: productData?.description || "",
        }];
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

  // Принудительно синхронизировать корзину с сервером
  async function syncCart() {
    const { tg_user_id } = getTgContext();
    if (!tg_user_id) return;

    try {
      setIsLoading(true);
      const serverItems = await fetchServerCart();
      
      // ★ UPDATED: Обогащаем данные товарами из products.js
      const serverCartNormalized = serverItems.map(serverItem => {
        const productId = Number(serverItem.product_key);
        const productData = getProductById(productId);
        
        return {
          id: productId,
          name: productData?.name || serverItem.name || `Товар ${productId}`,
          price: Number(productData?.price) || Number(serverItem.price) || 0,
          qty: Number(serverItem.qty) || 0,
          images: productData?.images || [serverItem.meta?.image].filter(Boolean) || [],
          description: productData?.description || "",
        };
      });

      setCart(serverCartNormalized);
      console.log("[cart] Cart synced with server:", serverCartNormalized.length, "items");
    } catch (e) {
      console.warn("[cart] Sync failed:", e);
    } finally {
      setIsLoading(false);
    }
  }

  const value = useMemo(
    () => ({ 
      cart, 
      total, 
      totalItems,
      isLoading,
      addItem, 
      setQty, 
      removeItem, 
      clearCart,
      getItemQuantity,
      syncCart,
    }),
    [cart, total, totalItems, isLoading]
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