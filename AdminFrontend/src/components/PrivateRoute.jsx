/* eslint-disable no-unused-vars */
// src/components/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({
  children,
  component: Component,
  ...rest
}) {
  const { isAuthenticated, initializing } = useAuth() || {};

  if (initializing) return null; // or a loading indicator

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (Component) return <Component {...rest} />;

  return children || null;
}
