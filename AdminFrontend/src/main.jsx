import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import App from "./App";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Dashboard from "./Pages/Dashboard";
import { ThemeProvider } from "./context/ThemeContext";
import NotificationsPage from "./Pages/NotificationsPage";
/* import { Toaster } from 'sonner'; */
import { Toaster } from "react-hot-toast";
import AuthProvider from "./context/AuthContext";
import LanguageSettings from "./Pages/LanguageSettings";
import UserPage from "./Pages/UserPage";
import Users from "./Pages/Users";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Router>
    <AuthProvider>
      <ThemeProvider>
        <Toaster richColors position="top-right" />
        <Routes>
          {/* Default path redirects to login */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Login and Register should be publicly accessible */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard is protected and only accessible by admin */}
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="NotificationsPage" element={<NotificationsPage />} />
          <Route path="/language-settings" element={<LanguageSettings />} />
          <Route path="/users" element={<Users />} />
          <Route path="/users/:userId" element={<UserPage />} />
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  </Router>
);
