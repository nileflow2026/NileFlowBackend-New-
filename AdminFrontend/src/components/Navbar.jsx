/* eslint-disable no-unused-vars */

/*
  (Old commented code removed — Navbar rewritten below to use in-memory notification buffer and context.)
*/
// src/components/Navigation/Navbar.jsx
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAdminNotifications,
  fetchUsers,
  getProfile,
} from "../../adminService";
import {
  account,
  avatars,
  client,
  Config,
  databases,
  Query,
} from "../../appwrite";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, Bell } from "lucide-react";
import { toast } from "sonner";
import { getCurrentUser, signoutAdmin } from "../../authService";
import { useAuth } from "../context/AuthContext";
import {
  getHasNew,
  setHasNew,
  getLastSeen,
  setLastSeen,
  subscribe,
} from "../notificationBuffer";

export default function Navbar() {
  const [dbUser, setDbUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [hasNewNotification, setHasNewNotification] = useState(() =>
    getHasNew()
  );
  const [notificationCount, setNotificationCount] = useState(0);
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);

  // Consolidated user data fetching
  useEffect(() => {
    const initializeUser = async () => {
      try {
        if (authUser) {
          setUser(authUser);
          setDbUser(authUser);
          return;
        }

        const currentUser = await getCurrentUser();
        const allUsers = await fetchUsers();
        const matchedUser = allUsers.find((u) => u.userId === currentUser.$id);

        if (matchedUser) {
          setUser(matchedUser);
          setDbUser(matchedUser);
        }
      } catch (err) {
        console.error("Error loading user info:", err.message);
      }
    };

    initializeUser();
  }, [authUser]);

  // Real-time notifications with optimized subscription
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        await fetchAdminNotifications();
      } catch (err) {
        console.error("Failed to fetch admin notifications:", err.message);
      }
    };

    initializeNotifications();

    const lastSeenVal = getLastSeen();
    const parsedLastSeen = lastSeenVal ? new Date(lastSeenVal).getTime() : 0;

    const unsubscribe = client.subscribe(
      `databases.${Config.databaseId}.collections.${Config.NOTIFICATIONS_COLLECTION_ID}.documents`,
      (response) => {
        if (
          response.events.includes(
            "databases.*.collections.*.documents.*.create"
          )
        ) {
          const notification = response.payload;
          const createdAt = new Date(notification.$createdAt).getTime();

          if (notification.type === "order") {
            toast(`👤 Admin Alert: ${notification.message}`, {
              description: new Date(notification.$createdAt).toLocaleString(),
            });
            setNotificationCount((prev) => prev + 1);
            setHasNew(true);
          } else if (notification.type === "user") {
            toast(`📦 User Order Update: ${notification.message}`, {
              description: new Date(notification.$createdAt).toLocaleString(),
            });
          }
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // Subscribe to in-memory notification buffer changes
  useEffect(() => {
    const unsub = subscribe((v) => setHasNewNotification(v));
    return () => unsub();
  }, []);

  // Derived user data
  const username = user?.username || dbUser?.username || "Admin";
  const role = user?.role || dbUser?.role || "admin";
  const avatar =
    user?.prefs?.avatar ||
    dbUser?.avatar ||
    (dbUser?.username ? avatars.getInitials(dbUser.username).href : null);

  const handleLogout = async () => {
    try {
      await signoutAdmin();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("Failed to log out. Please try again.");
    }
  };

  const handleNotificationClick = () => {
    setHasNew(false);
    navigate("/NotificationsPage");
    setNotificationCount(0);
    setLastSeen(new Date().toISOString());
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-[#FAF7F2] dark:bg-[#1A1A1A] border-b border-[#E8D6B5]/30 dark:border-[#3A3A3A] shadow-[0_4px_12px_rgba(0,0,0,0.05)] backdrop-blur-sm">
      <div className="max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Left Section - Dashboard Title */}
          <div className="flex items-center">
            <div className="relative">
              <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-[#D4A017] via-[#B8860B] to-[#8B6914] bg-clip-text text-transparent">
                Dashboard
              </h1>
              <div className="absolute -bottom-1 left-0 w-12 h-0.5 bg-gradient-to-r from-[#D4A017] to-[#8B6914] rounded-full"></div>
            </div>
          </div>

          {/* Right Section - User Controls */}
          <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6">
            {/* User Info - Desktop Only */}
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-medium text-[#2C1810] dark:text-[#F5E6D3] leading-tight">
                {username}
              </span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-[#27AE60]"></div>
                <span className="text-xs font-semibold text-[#27AE60] dark:text-[#2ECC71] uppercase tracking-wide">
                  {role}
                </span>
              </div>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={handleNotificationClick}
                className="relative p-2 rounded-full transition-all duration-200 hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50"
                aria-label={`Notifications ${
                  notificationCount > 0 ? `(${notificationCount} new)` : ""
                }`}
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-[#8B4513] dark:text-[#F5E6D3]" />

                {/* Notification Indicators */}
                {hasNewNotification && (
                  <>
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#E74C3C] animate-ping"></span>
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#E74C3C]"></span>
                  </>
                )}

                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full transition-all duration-300 hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50"
              aria-label={`Switch to ${
                theme === "dark" ? "light" : "dark"
              } mode`}
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-[#F5E6D3] hover:text-[#D4A017]" />
              ) : (
                <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-[#8B4513] hover:text-[#D4A017]" />
              )}
            </button>

            {/* Avatar & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50 rounded-full"
                aria-label="User menu"
              >
                <div className="relative">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={`${username}'s avatar`}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-[#E8D6B5] dark:border-[#3A3A3A] object-cover shadow-md transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          username
                        )}&background=D4A017&color=fff&bold=true`;
                      }}
                    />
                  ) : (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center border-2 border-[#E8D6B5] dark:border-[#3A3A3A]">
                      <span className="text-white font-bold text-sm">
                        {username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Online Status Indicator */}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#27AE60] border-2 border-[#FAF7F2] dark:border-[#1A1A1A] rounded-full"></div>
                </div>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setDropdownOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 z-40 w-48 bg-[#FAF7F2] dark:bg-[#2A2A2A] border border-[#E8D6B5] dark:border-[#3A3A3A] rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
                    <div className="px-4 py-3 border-b border-[#E8D6B5]/30 dark:border-[#3A3A3A]">
                      <p className="text-sm font-semibold text-[#2C1810] dark:text-[#F5E6D3] truncate">
                        {username}
                      </p>
                      <p className="text-xs text-[#8B4513] dark:text-[#D4A017] font-medium capitalize">
                        {role}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate("/profile");
                        }}
                        className="w-full px-4 py-2.5 text-sm text-left text-[#2C1810] dark:text-[#F5E6D3] hover:bg-[#E8D6B5]/20 dark:hover:bg-[#3A3A3A] transition-colors duration-150 flex items-center"
                      >
                        👤 Profile Settings
                      </button>

                      <button
                        onClick={() => {
                          handleLogout();
                          setDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-sm text-left text-[#E74C3C] hover:bg-[#E74C3C]/10 dark:hover:bg-[#E74C3C]/20 transition-colors duration-150 flex items-center"
                      >
                        <span className="mr-2">🚪</span> Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
