import React, { useState, useEffect, useCallback } from "react";
import { useNotification } from "../Context/NotificationContext";
import {
  Bell,
  X,
  Check,
  Truck,
  ShoppingBag,
  Heart,
  AlertTriangle,
  Info,
  Star,
  Gift,
  Shield,
} from "lucide-react";

const NotificationToast = () => {
  const { notifications, markAsRead } = useNotification();
  const [activeToasts, setActiveToasts] = useState([]);
  const [lastProcessedId, setLastProcessedId] = useState(null);

  // Get icon for notification type
  const getNotificationIcon = useCallback((type, priority) => {
    if (priority === "high" || priority === "urgent") {
      return <AlertTriangle className="w-5 h-5 text-red-400" />;
    }

    switch (type) {
      case "order":
      case "shipping":
      case "delivery":
        return <Truck className="w-5 h-5 text-blue-400" />;
      case "purchase":
      case "payment":
        return <ShoppingBag className="w-5 h-5 text-emerald-400" />;
      case "promotion":
      case "deal":
      case "discount":
        return <Gift className="w-5 h-5 text-amber-400" />;
      case "favorite":
      case "wishlist":
        return <Heart className="w-5 h-5 text-red-400" />;
      case "review":
      case "rating":
        return <Star className="w-5 h-5 text-yellow-400" />;
      case "security":
      case "account":
        return <Shield className="w-5 h-5 text-purple-400" />;
      case "info":
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  }, []);

  // Get notification colors based on type and priority
  const getNotificationColors = useCallback((type, priority) => {
    if (priority === "high" || priority === "urgent") {
      return {
        bg: "from-red-900/90 to-red-800/90",
        border: "border-red-500/50",
        glow: "shadow-red-900/30",
      };
    }

    switch (type) {
      case "order":
      case "shipping":
      case "delivery":
        return {
          bg: "from-blue-900/90 to-blue-800/90",
          border: "border-blue-500/50",
          glow: "shadow-blue-900/30",
        };
      case "promotion":
      case "deal":
        return {
          bg: "from-amber-900/90 to-amber-800/90",
          border: "border-amber-500/50",
          glow: "shadow-amber-900/30",
        };
      case "purchase":
        return {
          bg: "from-emerald-900/90 to-emerald-800/90",
          border: "border-emerald-500/50",
          glow: "shadow-emerald-900/30",
        };
      default:
        return {
          bg: "from-gray-900/90 to-gray-800/90",
          border: "border-gray-500/50",
          glow: "shadow-gray-900/30",
        };
    }
  }, []);

  // Process new notifications and show toasts
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    // Get the most recent unread notification that hasn't been processed
    const latestNotification = notifications.find(
      (n) => !n.read && n.$id !== lastProcessedId,
    );

    if (!latestNotification) return;

    // Don't show toast if the page is visible (user can see the notification in the UI)
    if (!document.hidden) {
      setLastProcessedId(latestNotification.$id);
      return;
    }

    // Create toast for the new notification
    const toast = {
      id: latestNotification.$id,
      notification: latestNotification,
      timestamp: Date.now(),
    };

    setActiveToasts((prev) => [toast, ...prev.slice(0, 2)]); // Keep max 3 toasts
    setLastProcessedId(latestNotification.$id);

    // Auto-dismiss toast after 5 seconds
    setTimeout(() => {
      setActiveToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 5000);
  }, [notifications, lastProcessedId]);

  // Dismiss toast
  const dismissToast = useCallback(
    (toastId, markRead = false) => {
      setActiveToasts((prev) => prev.filter((t) => t.id !== toastId));

      if (markRead) {
        markAsRead(toastId);
      }
    },
    [markAsRead],
  );

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {activeToasts.map((toast) => {
        const { notification } = toast;
        const colors = getNotificationColors(
          notification.type,
          notification.priority,
        );
        const icon = getNotificationIcon(
          notification.type,
          notification.priority,
        );

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto bg-gradient-to-r ${colors.bg} backdrop-blur-sm border ${colors.border} rounded-2xl p-4 shadow-2xl ${colors.glow} transform transition-all duration-300 ease-out animate-slide-in-right max-w-sm min-w-[320px]`}
          >
            <div className="flex items-start space-x-3">
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                {icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-sm leading-tight">
                      {notification.message || "New Notification"}
                    </h4>
                    {notification.description && (
                      <p className="text-white/80 text-xs mt-1 leading-relaxed">
                        {notification.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                    <button
                      onClick={() => dismissToast(toast.id, true)}
                      className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </button>
                    <button
                      onClick={() => dismissToast(toast.id)}
                      className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                      title="Dismiss"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-white/60 text-xs">
                    {new Date(
                      notification.timestamp || notification.$createdAt,
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  {notification.priority === "high" && (
                    <span className="text-xs bg-red-500/20 text-red-200 px-2 py-0.5 rounded-full">
                      High Priority
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Progress bar for auto-dismiss */}
            <div className="mt-3 w-full h-0.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-white/30 to-white/60 animate-countdown-bar"></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationToast;
