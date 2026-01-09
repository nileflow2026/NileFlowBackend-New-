/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { useCart } from "./CartContext";

const AddToCartButton = ({ product, className }) => {
  const { addItemToCart, addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 2000); // Revert back after 2 seconds
  };

  return (
    <button
      onClick={handleAddToCart}
      className={`mt-4 w-full py-2 rounded-md transition-colors duration-300 ${
        isAdded
          ? "bg-green-600 text-white"
          : "bg-amber-600 text-white hover:bg-amber-700"
      } ${className}`}
    >
      {isAdded ? "It’s Flowing !" : "Let It Flow"}
    </button>
  );
};

export default AddToCartButton;
