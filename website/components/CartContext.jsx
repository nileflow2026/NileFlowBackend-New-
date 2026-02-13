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
  const [guestCart, setGuestCart] = useState([]);

  useEffect(() => {
    loadUserId();
    // Load guest cart from localStorage on initialization
    const savedGuestCart = localStorage.getItem("@guest_cart_items");
    if (savedGuestCart) {
      try {
        setGuestCart(JSON.parse(savedGuestCart));
      } catch (err) {
        console.warn("Invalid guest cart cache:", err);
      }
    }
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

      // step 4: merge guest cart with user cart if guest cart exists
      if (guestCart.length > 0) {
        mergeGuestCartWithUserCart();
      }
    } else {
      // If no userId, show guest cart
      setCart(guestCart);
    }
  }, [userId, guestCart]);

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

  const mergeGuestCartWithUserCart = async () => {
    if (!userId || guestCart.length === 0) return;

    try {
      const userName = await fetchUserName();

      // Add each guest cart item to user's cart
      for (const guestItem of guestCart) {
        try {
          await axiosClient.post("/cart/add", {
            userId,
            productId: guestItem.productId,
            productName: guestItem.productName,
            price: guestItem.price,
            image: guestItem.productImage,
            userName,
          });
        } catch (error) {
          console.warn(
            `Failed to merge guest item ${guestItem.productName}:`,
            error
          );
        }
      }

      // Clear guest cart after successful merge
      setGuestCart([]);
      localStorage.removeItem("@guest_cart_items");

      // Reload user cart to include merged items
      await loadCartFromStorage();

      toast.success(`Merged ${guestCart.length} items to your cart!`);
    } catch (error) {
      console.error("Error merging guest cart:", error);
      toast.error("Failed to merge cart items");
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
    console.log("Adding product to cart:", product);

    // Check if user is authenticated
    if (!userId) {
      // Handle guest user - store in guest cart
      const existingGuestItem = guestCart.find(
        (item) => item.productId === product.$id
      );

      if (existingGuestItem) {
        toast.info("Item already exists in your cart");
        return;
      }

      const guestItem = {
        id: `guest-${Date.now()}`,
        $id: `guest-${Date.now()}`,
        userId: null,
        productId: product.$id,
        productName: product.productName,
        productImage: product.productImage,
        price: product.price,
        quantity: 1,
        userName: null,
        isGuest: true,
      };

      const updatedGuestCart = [...guestCart, guestItem];
      setGuestCart(updatedGuestCart);
      setCart(updatedGuestCart); // Update cart display
      localStorage.setItem(
        "@guest_cart_items",
        JSON.stringify(updatedGuestCart)
      );

      toast.success("Added to Cart (Sign in to save your cart!)");
      return;
    }

    // Check if item already exists in current cart for authenticated users
    const existingItem = cart.find(
      (item) =>
        item.productId === product.$id || item.productId === String(product.$id)
    );

    if (existingItem) {
      toast.info("Item already exists in your cart");
      return;
    }

    // Handle authenticated user - original logic
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

      if (
        res.data.message === "Already in cart" ||
        res.data.message === "Item already exists"
      ) {
        // Instead of rolling back, check if the item actually exists in the current cart state
        const actualExistingItem = cart.find(
          (item) =>
            item.productId === product.$id ||
            item.productId === String(product.$id)
        );

        if (!actualExistingItem) {
          // Item doesn't exist in current state, so let's keep the optimistic item
          console.log(
            "Backend says already exists but not in current cart state, keeping item"
          );
          toast.success("Added to Cart");
        } else {
          // Item actually exists, rollback optimistic item
          setCart((prev) => {
            const updated = prev.filter((item) => item.id !== tempItem.id);
            localStorage.setItem(
              `@cart_items_${userId}`,
              JSON.stringify(updated)
            );
            return updated;
          });
          toast.info("Item already exists in your cart");
        }
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
    const itemToRemove = cart.find((item) => item.id === cartItemId);

    // Check if it's a guest item
    if (!userId || itemToRemove?.isGuest) {
      // Handle guest cart removal
      const updatedGuestCart = guestCart.filter(
        (item) => item.id !== cartItemId
      );
      setGuestCart(updatedGuestCart);
      setCart(updatedGuestCart);
      localStorage.setItem(
        "@guest_cart_items",
        JSON.stringify(updatedGuestCart)
      );
      toast.success("Removed from Cart");
      return;
    }

    // Optimistic removal for authenticated users
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
    if (!userId) {
      // Handle guest cart clear
      setGuestCart([]);
      setCart([]);
      localStorage.removeItem("@guest_cart_items");
      toast.info("Cart cleared");
      return;
    }

    try {
      // 1. Optimistic update for authenticated users
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

    // Find the item to check if it's a guest item - check both id and productId
    const itemToUpdate = cart.find(
      (item) =>
        item.id === cartItemId ||
        item.productId === cartItemId ||
        item.$id === cartItemId
    );

    if (!userId || itemToUpdate?.isGuest) {
      // Handle guest cart quantity update - check all possible ID fields
      const updatedGuestCart = guestCart.map((item) =>
        item.id === cartItemId ||
        item.productId === cartItemId ||
        item.$id === cartItemId
          ? { ...item, quantity: newQuantity }
          : item
      );
      setGuestCart(updatedGuestCart);
      setCart(updatedGuestCart);
      localStorage.setItem(
        "@guest_cart_items",
        JSON.stringify(updatedGuestCart)
      );
      toast.info("Quantity updated");
      return;
    }

    // Snapshot for rollback
    const prevCart = [...cart];

    // 1. Optimistic update for authenticated users - check all possible ID fields
    const updatedCart = prevCart.map((item) =>
      item.id === cartItemId ||
      item.productId === cartItemId ||
      item.$id === cartItemId
        ? { ...item, quantity: newQuantity }
        : item
    );
    setCart(updatedCart);
    localStorage.setItem(`@cart_items_${userId}`, JSON.stringify(updatedCart));
    toast.info("Quantity updated");

    try {
      // 2. Background sync - use the productId for the API call, not the document ID
      const productIdForAPI = itemToUpdate?.productId || cartItemId;
      console.log(
        "Updating quantity for productId:",
        productIdForAPI,
        "to quantity:",
        newQuantity
      );

      const res = await axiosClient.put(`/cart/update/${productIdForAPI}`, {
        quantity: newQuantity,
        userId,
      });

      console.log("Update quantity response:", res.status, res.data);

      if (res.status === 200) {
        const updated = res.data;

        // Only update if backend returned valid data
        if (updated && typeof updated.quantity === "number") {
          // use latest state instead of stale `cart` - check all possible ID fields
          setCart((current) =>
            current.map((item) =>
              item.id === cartItemId ||
              item.productId === cartItemId ||
              item.$id === cartItemId
                ? { ...item, quantity: updated.quantity }
                : item
            )
          );

          // also refresh cache from latest state - check all possible ID fields
          const fresh = updatedCart.map((item) =>
            item.id === cartItemId ||
            item.productId === cartItemId ||
            item.$id === cartItemId
              ? { ...item, quantity: updated.quantity }
              : item
          );
          localStorage.setItem(`@cart_items_${userId}`, JSON.stringify(fresh));
        } else {
          console.log(
            "Backend returned invalid quantity data, keeping optimistic update"
          );
        }
      } else {
        console.warn("Backend update failed with status:", res.status);
        // Don't rollback for non-200 status if it's not a critical error
        toast.warning("Quantity updated locally (sync pending)");
      }
    } catch (error) {
      console.error("Error updating cart quantity:", error);

      // Only rollback if it's a network error or critical failure
      // Don't rollback for validation errors or other non-critical issues
      if (error.code === "NETWORK_ERROR" || error.response?.status >= 500) {
        // Rollback if backend fails critically
        setCart(prevCart);
        localStorage.setItem(`@cart_items_${userId}`, JSON.stringify(prevCart));
        toast.error("Failed to update quantity");
      } else {
        console.log(
          "Non-critical error, keeping optimistic update:",
          error.message
        );
        toast.warning("Quantity updated (sync will retry later)");
      }
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
