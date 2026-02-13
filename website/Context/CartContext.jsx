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
import * as Toastify from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const { toast } = Toastify;

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loadingUser, setLoadingUser] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadCartFromStorage();
    loadUserId();
  }, []);
  const loadCartFromStorage = async () => {
    try {
      const res = await axiosClient.get(`/cart/load/${userId}`);

      if (res.status === 200) {
        setCart(res.data);

        // Optional: cache for offline support
        localStorage.setItem(`@cart_items_${userId}`, JSON.stringify(res.data));
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

  // Add this function to check stock before adding to cart
  const checkProductStock = async (productId, quantity = 1) => {
    try {
      const response = await axiosClient.get(
        `/api/admin/products/products/${productId}/stock`
      );
      return response.data;
    } catch (error) {
      console.error("Error checking product stock:", error);
      return { available: false, stock: 0 };
    }
  };

  const addToCart = async (product) => {
    console.log("Toast in CartContext:", toast);
    console.log("Sending to backend:", {
      userId,
      productId: product.$id,
      productName: product.productName,
      price: product.price,
      image: product.image,
      userName,
    });

    // First check stock
    const stockCheck = await checkProductStock(product.$id);

    if (!stockCheck.available || stockCheck.stock < 1) {
      toast.error("Product is out of stock");
      return;
    }

    if (stockCheck.stock < quantity) {
      toast.error(`Only ${stockCheck.stock} items available`);
      return;
    }

    try {
      const userName = await fetchUserName();

      // Add stock validation before checkout
      const validateCartStock = async () => {
        try {
          const response = await axiosClient.post("/cart/validate-stock", {
            cart: cart,
            userId: userId,
          });
          return response.data;
        } catch (error) {
          console.error("Error validating cart stock:", error);
          return { isValid: false, errors: ["Failed to validate stock"] };
        }
      };

      const res = await axiosClient.post("/cart/add", {
        userId,
        productId: product.$id,
        productName: product.productName,
        price: product.price,
        image: product.image,
        userName,
      });

      // Axios automatically parses JSON, no need for res.json()
      const data = res.data;
      if (data.success) {
        setCart((prev) => [...prev, data.item]);
        toast.success("Added to Cart");
      } else {
        toast.error(data.error || "Error adding to cart");
      }
      // Assuming your backend returns { success: true, item: {...} }
    } catch (error) {
      console.error(error);
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      const res = await axiosClient.delete(`/cart/remove/${cartItemId}`);

      if (res.status === 200) {
        setCart((prev) => prev.filter((item) => item.$id !== cartItemId));
        toast.success("Removed from Cart");
      }
    } catch (err) {
      console.error("Error removing from cart:", err);
      toast.error("Failed to remove from cart");
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      const res = await axiosClient.put(`/cart/update/${cartItemId}`, {
        quantity: newQuantity,
      });

      if (res.status === 200) {
        const updated = res.data; // backend returns updated doc
        setCart((prevCart) =>
          prevCart.map((item) =>
            item.$id === cartItemId
              ? { ...item, quantity: updated.quantity }
              : item
          )
        );
        toast.success("Quantity updated");
      }
    } catch (error) {
      console.error("Error updating cart quantity:", error);
      toast.success("Failed to update quantity");
    }
  };

  const fetchCartItems = async () => {
    try {
      const res = await axiosClient.get(`/cart/fetch/${userId}`);

      if (res.status === 200) {
        setCart(res.data); // backend already returns the documents
      } else {
        setCart([]);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      setCart([]);
    } finally {
      setLoadingCart(false);
    }
  };

  // In your CartContext.js or CartProvider.js
  const clearCart = async () => {
    try {
      // Get userId
      const userId = await fetchUserId(); // Or from your auth context

      // 1. Clear frontend state
      setCart([]);

      // 2. Clear localStorage
      localStorage.removeItem(`@cart_items_${userId}`);

      // 3. Clear backend cart (IMPORTANT!)
      try {
        await axiosClient.delete(`/cart/clear/${userId}`);
        console.log("✅ Backend cart cleared");
      } catch (backendError) {
        console.error("Backend cart clear failed:", backendError);
        // Continue anyway - we'll sync on next load
      }

      toast.success("Cart cleared successfully");
    } catch (err) {
      console.error("Error clearing cart:", err);
      toast.error("Failed to clear cart");
    }
  };

  const cartValue = useMemo(
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
    <CartContext.Provider value={cartValue}>{children}</CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
