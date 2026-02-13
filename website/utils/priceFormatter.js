/**
 * Simple price formatter for displaying exact prices from backend database
 *
 * IMPORTANT: This system assumes all prices in the database are stored in KES (Kenyan Shillings)
 * and displays them without any currency conversion.
 *
 * The backend should store prices in KES format, and this formatter will display them
 * with the KSh symbol for consistency across the application.
 */

// Default currency symbol - KES (Kenyan Shilling)
const DEFAULT_CURRENCY_SYMBOL = "KSh";

export const formatPrice = (price) => {
  if (typeof price !== "number" || isNaN(price)) {
    return `${DEFAULT_CURRENCY_SYMBOL} 0.00`;
  }

  return `${DEFAULT_CURRENCY_SYMBOL} ${price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatPriceWithoutSymbol = (price) => {
  if (typeof price !== "number" || isNaN(price)) {
    return "0.00";
  }

  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
