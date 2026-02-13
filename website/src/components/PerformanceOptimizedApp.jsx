import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router } from "react-router-dom";

// Lazy load context providers that aren't critical for initial render
const PremiumProvider = lazy(() =>
  import("../Context/PremiumContext").then((module) => ({
    default: module.PremiumProvider,
  })),
);
const FavoritesProvider = lazy(() =>
  import("../Context/FavoritesContext.jsx").then((module) => ({
    default: module.FavoritesProvider,
  })),
);
const NotificationProvider = lazy(() =>
  import("../Context/NotificationContext").then((module) => ({
    default: module.NotificationProvider,
  })),
);

// Keep critical providers synchronous
import CustomerAuthProvider from "../Context/CustomerAuthContext";
import { CurrencyProvider } from "../Context/CurrencyProvider";
import { CartProvider } from "../../components/CartContext";

const AppWrapper = ({ children }) => {
  return (
    <Router>
      <CustomerAuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <Suspense fallback={<div className="min-h-screen bg-black" />}>
              <PremiumProvider>
                <FavoritesProvider>
                  <NotificationProvider>{children}</NotificationProvider>
                </FavoritesProvider>
              </PremiumProvider>
            </Suspense>
          </CartProvider>
        </CurrencyProvider>
      </CustomerAuthProvider>
    </Router>
  );
};

export default AppWrapper;
