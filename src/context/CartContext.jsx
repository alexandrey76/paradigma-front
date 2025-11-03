// src/context/CartContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getTgContext,
  fetchServerCart,
  addServerCartItem,
  updateServerCartQty,
  deleteServerCartItem,
  cartDelta, // уже был
} from "../api/cartApi";
import products from "../data/products";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // получить товар по ID из локального справочника
  const getProductById = (productId) => {
    return products.find((product) => product.id === productId);
  };

  // обогащаем серверные позиции данными из products.js
  const enrichCartItem = (serverItem) => {
    const productId = Number(serverItem.product_key);
    const productData = getProductById(productId);

    return {
      id: productId,
      name: productData?.name || serverItem.name || `Товар ${productId}`,
      price: Number(productData?.price) || Number(serverItem.price) || 0,
      qty: Number(serverItem.qty) || 0,
      images:
        productData?.images || [serverItem.meta?.image].filter(Boolean) || [],
      description: productData?.description || "",
    };
  };

  const total = useMemo(
    () =>
      cart.reduce(
        (s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0),
        0
      ),
    [cart]
  );

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty, 0),
    [cart]
  );

  // сохраняем локально
  useEffect(() => {
    localStorage.setItem("cart_v1", JSON.stringify(cart));
  }, [cart]);

  // при старте тянем корзину с бэка
  useEffect(() => {
    const loadCartFromServer = async () => {
      const { tg_user_id } = getTgContext();

      // ======== случая ТГ-юзера нет =========
      if (!tg_user_id) {
        console.info("[cart] no tg_user_id — работаем только локально");
        setIsLoading(false);

        // важно: сообщаем App, что корзину больше ждать не надо
        try {
          window.__APP_CART_READY__ = true;
          window.dispatchEvent(new Event("app:cart-ready"));
        } catch {}
        return;
      }

      // ======== обычный случай: юзер есть =========
      try {
        console.log("[cart] Loading cart from server for user:", tg_user_id);
        const serverItems = await fetchServerCart();

        const serverCartNormalized = serverItems.map(enrichCartItem);
        console.log(
          "[cart] Server cart loaded:",
          serverCartNormalized.length,
          "items"
        );
        setCart(serverCartNormalized);
      } catch (e) {
        console.warn("[cart] fetchServerCart failed:", e);
        // если с сервера не вышло — достаём локально
        try {
          const localCart = localStorage.getItem("cart_v1");
          if (localCart) {
            const parsed = JSON.parse(localCart);
            setCart(Array.isArray(parsed) ? parsed : []);
          }
        } catch (localError) {
          console.warn("[cart] Local storage load failed:", localError);
        }
      } finally {
        setIsLoading(false);

        // СЮДА ГЛАВНОЕ: корзина инициализировалась (успех или фолбэк) — даём сигнал
        try {
          window.__APP_CART_READY__ = true;
          window.dispatchEvent(new Event("app:cart-ready"));
        } catch {}
      }
    };

    loadCartFromServer();
  }, []);

  // безопасный вызов API
  async function safeApiCall(promise, label) {
    try {
      return await promise;
    } catch (e) {
      console.warn(`[cart:${label}] API call failed:`, e);
      return null;
    }
  }

  // ====== добавить/убавить товар дельтой ======
  async function addItem(product, inc = 1) {
    const id = Number(product?.id);
    // если нет id или 0 дельта — делать нечего
    if (!id || !inc) return;

    // возьмём нормальные данные товара
    const productData = getProductById(id) || product;

    // 1) обновляем локальный стейт
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.id === id);

      // товара ещё нет
      if (idx === -1) {
        // и прилетел минус — ничего не делаем
        if (inc < 0) return prev;
        // иначе создаём
        return [
          ...prev,
          {
            id,
            name: productData?.name || `Товар ${id}`,
            price: Number(productData?.price) || 0,
            qty: inc,
            images: productData?.images || [],
            description: productData?.description || "",
          },
        ];
      }

      // товар есть — меняем количество
      const current = prev[idx];
      const nextQty = (Number(current.qty) || 0) + Number(inc);

      // стало 0 или меньше — удаляем позицию
      if (nextQty <= 0) {
        const copy = [...prev];
        copy.splice(idx, 1);
        return copy;
      }

      // иначе обновляем qty
      const copy = [...prev];
      copy[idx] = { ...current, qty: nextQty };
      return copy;
    });

    // 2) синхронизируем с сервером
    const { tg_user_id } = getTgContext();
    if (!tg_user_id) return;

    await safeApiCall(
      cartDelta({ product: productData, delta: inc }),
      "delta"
    );
  }

  // установить абсолютное количество
  async function setQty(id, qty) {
    id = Number(id);
    qty = Number(qty);

    const currentItem = cart.find((item) => item.id === id);
    if (!currentItem) {
      console.warn(`[cart] Product ${id} not found in cart`);
      return;
    }

    // 1) локально
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx === -1) return prev;

      if (qty <= 0) {
        return prev.filter((x) => x.id !== id);
      } else {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty };
        return copy;
      }
    });

    // 2) на бэк
    const { tg_user_id } = getTgContext();
    if (!tg_user_id) return;

    const productData = getProductById(id) || currentItem;

    if (qty <= 0) {
      await safeApiCall(deleteServerCartItem(id), "delete");
    } else {
      await safeApiCall(
        cartDelta({ product: productData, setQty: qty }),
        "updateQty"
      );
    }
  }

  // удалить товар
  async function removeItem(id) {
    id = Number(id);
    const currentItem = cart.find((item) => item.id === id);
    if (!currentItem) return;

    // 1) локально
    setCart((prev) => prev.filter((x) => x.id !== id));

    // 2) на бэк
    const { tg_user_id } = getTgContext();
    if (!tg_user_id) return;

    const productData = getProductById(id) || currentItem;
    await safeApiCall(
      cartDelta({ product: productData, setQty: 0 }),
      "removeItem"
    );
  }

  // очистить
  async function clearCart() {
    const { tg_user_id } = getTgContext();

    // локально
    setCart([]);

    // на бэк
    if (tg_user_id && cart.length > 0) {
      const deletePromises = cart.map((item) =>
        safeApiCall(deleteServerCartItem(item.id), "clearCartItem")
      );
      await Promise.allSettled(deletePromises);
    }
  }

  // кол-во конкретного товара
  function getItemQuantity(productId) {
    const item = cart.find((item) => item.id === productId);
    return item ? item.qty : 0;
  }

  // ручная синхронизация
  async function syncCart() {
    const { tg_user_id } = getTgContext();
    if (!tg_user_id) return;

    try {
      setIsLoading(true);
      const serverItems = await fetchServerCart();
      const serverCartNormalized = serverItems.map(enrichCartItem);
      setCart(serverCartNormalized);
      console.log(
        "[cart] Cart synced with server:",
        serverCartNormalized.length,
        "items"
      );
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

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
