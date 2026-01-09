/* eslint-disable react-hooks/exhaustive-deps */

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { toast } from "react-toastify";

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const isMounted = useRef(false);

  useEffect(() => {
    const loadFavorites = () => {
      try {
        const storedFavorites = localStorage.getItem("nile-favorites");
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites));
        }
      } catch (error) {
        console.error("Failed to load favorites:", error);
      }
    };
    loadFavorites();
  }, []);

  useEffect(() => {
    if (isMounted.current) {
      try {
        localStorage.setItem("nile-favorites", JSON.stringify(favorites));
      } catch (error) {
        console.error("Failed to save favorites:", error);
      }
    } else {
      isMounted.current = true;
    }
  }, [favorites]);

  const addToFavorites = (product) => {
    const productId = product.$id || product.id;
    setFavorites((prev) => {
      if (!prev.find((fav) => (fav.$id || fav.id) === productId)) {
        toast.success("Added to wishlist! ❤️", {
          position: "bottom-right",
          autoClose: 2000,
        });
        return [...prev, { ...product, id: productId, $id: productId }];
      } else {
        toast.info("Already in wishlist", {
          position: "bottom-right",
          autoClose: 2000,
        });
        return prev;
      }
    });
  };

  const removeFromFavorites = (productId) => {
    setFavorites((prev) =>
      prev.filter((fav) => (fav.$id || fav.id) !== productId)
    );
    toast.info("Removed from wishlist", {
      position: "bottom-right",
      autoClose: 2000,
    });
  };

  const isFavorite = (productId) => {
    return favorites.some((fav) => (fav.$id || fav.id) === productId);
  };

  const toggleFavorite = (product) => {
    const productId = product.$id || product.id;
    if (isFavorite(productId)) {
      removeFromFavorites(productId);
    } else {
      addToFavorites(product);
    }
  };

  const favoritesValue = useMemo(
    () => ({
      favorites,
      addToFavorites,
      removeFromFavorites,
      isFavorite,
      toggleFavorite,
    }),
    [favorites]
  );
  return (
    <FavoritesContext.Provider value={favoritesValue}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);
