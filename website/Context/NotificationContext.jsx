/* eslint-disable react-refresh/only-export-components */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { getCustomerNotification } from "../CustomerServices";
import { client, Config } from "../appwrite";
import { getCurrentUser } from "../authServices";
import notificationService from "../services/NotificationService";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [pushSubscription, setPushSubscription] = useState(null);
  const [lastNotificationTime, setLastNotificationTime] = useState(null);

  // Initialize notification service and check permissions
  const initializeNotifications = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user || !user.$id) return;

      // Initialize push notification service
      const initialized = await notificationService.initialize();
      if (initialized) {
        const status = notificationService.getStatus();
        setIsNotificationsEnabled(status.enabled);
        setPushSubscription(status.subscribed);
      }

      // Load existing notifications
      const notificationsData = await getCustomerNotification();
      setNotifications(notificationsData || []);
      const unreadCount = (notificationsData || []).filter(
        (n) => !n.read,
      ).length;
      setNotificationCount(unreadCount);

      console.log(
        `🔔 Loaded ${notificationsData?.length || 0} notifications, ${unreadCount} unread`,
      );
    } catch (err) {
      console.error("❌ Error initializing notifications:", err);
    }
  }, []);

  // Request notification permission and setup push notifications
  const enableNotifications = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user || !user.$id) {
        throw new Error("User not authenticated");
      }

      // Request permission
      await notificationService.requestPermission();

      // Subscribe to push notifications
      const subscription = await notificationService.subscribeToPush(user.$id);

      setIsNotificationsEnabled(true);
      setPushSubscription(!!subscription);

      console.log("✅ Push notifications enabled successfully");

      // Show success notification
      notificationService.showLocalNotification("Notifications Enabled", {
        body: "You'll now receive real-time updates about your orders and exclusive deals!",
        tag: "notifications-enabled",
      });

      return true;
    } catch (error) {
      console.error("❌ Failed to enable notifications:", error);
      throw error;
    }
  }, []);

  // Disable notifications
  const disableNotifications = useCallback(async () => {
    try {
      await notificationService.unsubscribeFromPush();
      setIsNotificationsEnabled(false);
      setPushSubscription(false);
      console.log("🔕 Push notifications disabled");
    } catch (error) {
      console.error("❌ Failed to disable notifications:", error);
      throw error;
    }
  }, []);

  // Handle new notifications
  const handleNewNotification = useCallback(
    (notificationData) => {
      console.log("🔔 New notification received:", notificationData);

      setNotifications((prev) => [notificationData, ...prev]);
      setNotificationCount((prev) => prev + 1);
      setLastNotificationTime(new Date().toISOString());

      // Show browser notification if enabled
      if (isNotificationsEnabled && document.hidden) {
        notificationService.showLocalNotification(
          notificationData.message || "New Notification",
          {
            body: notificationData.description || "You have a new update",
            tag: `notification-${notificationData.$id}`,
            data: { notificationId: notificationData.$id },
          },
        );
      }

      // Play notification sound (optional)
      if (isNotificationsEnabled) {
        playNotificationSound();
      }
    },
    [isNotificationsEnabled],
  );

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      // Create audio context for notification sound
      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3,
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log("🔇 Could not play notification sound:", error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.$id === notificationId ? { ...n, read: true } : n)),
    );
    setNotificationCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setNotificationCount(0);
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setNotificationCount(0);
  }, []);

  // Setup real-time subscription
  useEffect(() => {
    initializeNotifications();

    const unsubscribe = client.subscribe(
      `databases.${Config.databaseId}.collections.${Config.NOTIFICATIONS_COLLECTION_ID}.documents`,
      async (response) => {
        const { payload, events } = response;
        const user = await getCurrentUser();

        if (!user || !user.$id) return;

        // Handle new notification creation
        if (events.includes("databases.*.documents.*.create")) {
          if (
            payload.userId === user.$id &&
            payload.type === "userNotification"
          ) {
            handleNewNotification(payload);
          }
        }

        // Handle notification updates (e.g., marked as read)
        if (events.includes("databases.*.documents.*.update")) {
          if (payload.userId === user.$id) {
            setNotifications((prev) =>
              prev.map((n) => (n.$id === payload.$id ? payload : n)),
            );

            // Update count if read status changed
            if (payload.read) {
              setNotificationCount((prev) => Math.max(0, prev - 1));
            }
          }
        }

        // Handle notification deletion
        if (events.includes("databases.*.documents.*.delete")) {
          setNotifications((prev) => prev.filter((n) => n.$id !== payload.$id));
          if (!payload.read) {
            setNotificationCount((prev) => Math.max(0, prev - 1));
          }
        }
      },
    );

    // Add notification service listener
    const notificationListener = (notification) => {
      handleNewNotification(notification);
    };
    notificationService.addListener(notificationListener);

    return () => {
      unsubscribe();
      notificationService.removeListener(notificationListener);
    };
  }, [initializeNotifications, handleNewNotification]);

  const value = {
    // State
    notificationCount,
    notifications,
    isNotificationsEnabled,
    pushSubscription,
    lastNotificationTime,

    // Actions
    setNotificationCount,
    enableNotifications,
    disableNotifications,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,

    // Service
    notificationService: notificationService.getStatus(),
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
};
