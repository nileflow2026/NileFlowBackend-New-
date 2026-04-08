// src/components/CustomerProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useCustomerAuth } from "../contexts/CustomerAuthContext";

export const CustomerProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useCustomerAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
};
export default CustomerProtectedRoute;
