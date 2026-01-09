/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react-refresh/only-export-components */

/* eslint-disable no-undef */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { fetchUserId, fetchUserName } from "../CustomerServices";
import axiosClient from "../api";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";

// 1. Create the Context
const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loadingUser, setLoadingUser] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      // step 2: try localStorage first (instant UI)
      const cached = localStorage.getItem(`@cart_items_${userId}`);
      if (cached) {
        try {
          setCart(JSON.parse(cached));
        } catch (err) {
          console.warn("Invalid cart cache:", err);
        }
      }

      // step 3: always refresh from backend
      loadCartFromStorage();
    }
  }, [userId]);

  const loadCartFromStorage = async () => {
    if (!userId) return; // prevent null fetch
    try {
      const res = await axiosClient.get(`/cart/load/${userId}`);

      if (res.status === 200) {
        // Backend's loadCart returns:
        // { id, userId, productId, productName, productImage, quantity, price, ... }
        // Normalize to ensure consistent field names for CartPage
        const normalizedCart = (res.data || []).map((item) => ({
          id: item.id,
          $id: item.id, // Use id as the $id since backend maps it that way
          userId: item.userId,
          productId: String(item.productId),
          productName: item.productName,
          productImage: item.productImage,
          price: item.price || 0,
          quantity: item.quantity || 1,
          userName: item.userName,
          createdAt: item.date || item.createdAt,
        }));

        setCart(normalizedCart);

        // Optional: cache for offline support
        localStorage.setItem(
          `@cart_items_${userId}`,
          JSON.stringify(normalizedCart)
        );
      } else {
        setCart([]);
      }
    } catch (error) {
      console.error("Error loading cart:", error);
      setCart([]);
    }
  };

  const loadUserId = async () => {
    setLoadingUser(true); // Start loading
    try {
      const id = await fetchUserId(); // Fetch the user ID
      setUserId(id); // Set the user ID in your app's state
      await loadCartFromStorage(); // Load the cart from Appwrite using the user ID
    } catch (error) {
      console.error("Error fetching user ID:", error);
    } finally {
      setLoadingUser(false); // Reset loading state
    }
  };

  const addToCart = async (product) => {
    const userName = await fetchUserName();

    // create a temporary optimistic item
    const tempItem = {
      id: `temp-${Date.now()}`,
      $id: `temp-${Date.now()}`, // temp backend ID placeholder
      userId,
      productId: product.$id,
      productName: product.productName,
      productImage: product.productImage,
      price: product.price,
      quantity: 1,
      userName,
    };

    // 1. Update cart & cache immediately
    setCart((prev) => {
      const updated = [...prev, tempItem];
      localStorage.setItem(`@cart_items_${userId}`, JSON.stringify(updated));
      return updated;
    });
    toast.success("Added to Cart");

    try {
      // 2. Call backend - send 'image' field as backend expects
      const res = await axiosClient.post("/cart/add", {
        userId,
        productId: product.$id,
        productName: product.productName,
        price: product.price,
        image: product.image || product.productImage, // Backend expects 'image', not 'productImage'
        userName,
      });

      // Backend returns { success: true, item: {...} }
      const backendItem = res.data.item;

      if (!backendItem) throw new Error("Backend did not return a cart item");

      // Normalize the backend item to match frontend expectations
      const normalizedItem = {
        id: backendItem.$id,
        $id: backendItem.$id,
        userId: backendItem.userId,
        productId: String(backendItem.productId),
        productName: backendItem.productName,
        productImage: backendItem.productImage,
        price: backendItem.price,
        quantity: backendItem.quantity || 1,
        userName: backendItem.userName,
        createdAt: backendItem.createdAt,
      };

      if (res.data.message === "Already in cart") {
        // rollback optimistic item if backend says exists
        setCart((prev) => {
          const updated = prev.filter((item) => item.id !== tempItem.id);
          localStorage.setItem(
            `@cart_items_${userId}`,
            JSON.stringify(updated)
          );
          return updated;
        });
        toast.info("Item already exists in your cart");
        return;
      }

      // Replace temp item with normalized backend item
      setCart((prev) => {
        const updated = prev.map((item) =>
          item.id === tempItem.id ? normalizedItem : item
        );
        localStorage.setItem(`@cart_items_${userId}`, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error("AddToCart error:", error);

      // rollback on failure
      setCart((prev) => {
        const updated = prev.filter((item) => item.id !== tempItem.id);
        localStorage.setItem(`@cart_items_${userId}`, JSON.stringify(updated));
        return updated;
      });
      toast.error("Failed to add to cart");
    }
  };

  const removeFromCart = async (cartItemId) => {
    const prevCart = [...cart];

    // Optimistic removal
    const updatedCart = prevCart.filter((item) => item.id !== cartItemId);
    setCart(updatedCart);
    localStorage.setItem(`@cart_items_${userId}`, JSON.stringify(updatedCart));
    toast.success("Removed from Cart");

    try {
      const res = await axiosClient.delete(`/cart/remove/${cartItemId}`);
      if (res.status !== 200) throw new Error("Backend failed");
    } catch (err) {
      console.error("RemoveFromCart error:", err);

      // rollback on failure
      setCart(prevCart);
      localStorage.setItem(`@cart_items_${userId}`, JSON.stringify(prevCart));
      toast.error("Failed to remove from cart");
    }
  };

  // ✅ Clear Cart
  const clearCart = async () => {
    try {
      // 1. Optimistic update
      const prevCart = cart;
      setCart([]);
      localStorage.setItem(`@cart_items_${userId}`, JSON.stringify([]));
      toast.info("Cart cleared");

      // 2. Background sync
      await axiosClient.delete(`/cart/clear/${userId}`);
    } catch (err) {
      console.error("Error clearing cart:", err);
      // Rollback
      const cached =
        JSON.parse(localStorage.getItem(`@cart_items_${userId}`)) || [];
      setCart(cached);
      toast.error("Failed to clear cart");
    }
  };

  // ✅ Fetch Cart (load cached first)
  const fetchCartItems = async () => {
    try {
      // 1. Load from cache instantly
      const cached =
        JSON.parse(localStorage.getItem(`@cart_items_${userId}`)) || [];
      if (cached.length) setCart(cached);

      // 2. Background sync from backend
      const res = await axiosClient.get(`/cart/fetch/${userId}`);
      if (res.status === 200) {
        setCart(res.data);
        localStorage.setItem(`@cart_items_${userId}`, JSON.stringify(res.data));
      } else {
        setCart([]);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      // Keep cached instead of wiping
    } finally {
      setLoadingCart(false);
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;

    // Snapshot for rollback
    const prevCart = [...cart];

    // 1. Optimistic update
    const updatedCart = prevCart.map((item) =>
      item.productId === cartItemId ? { ...item, quantity: newQuantity } : item
    );
    setCart(updatedCart);
    localStorage.setItem(`@cart_items_${userId}`, JSON.stringify(updatedCart));
    toast.info("Quantity updated");

    try {
      // 2. Background sync
      const res = await axiosClient.put(`/cart/update/${cartItemId}`, {
        quantity: newQuantity,
        userId,
      });

      if (res.status === 200) {
        const updated = res.data;

        // use latest state instead of stale `cart`
        setCart((current) =>
          current.map((item) =>
            item.productId === cartItemId
              ? { ...item, quantity: updated.quantity }
              : item
          )
        );

        // also refresh cache from latest state
        const fresh = updatedCart.map((item) =>
          item.productId === cartItemId
            ? { ...item, quantity: updated.quantity }
            : item
        );
        localStorage.setItem(`@cart_items_${userId}`, JSON.stringify(fresh));
      }
    } catch (error) {
      console.error("Error updating cart quantity:", error);

      // Rollback if backend fails
      setCart(prevCart);
      localStorage.setItem(`@cart_items_${userId}`, JSON.stringify(prevCart));
      toast.error("Failed to update quantity");
    }
  };

  const contextValue = useMemo(
    () => ({
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      setCart,
      updateQuantity,
      fetchCartItems,
    }),
    [cart]
  );

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
};

// 3. Create a custom hook to use the context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
