// Real-time Notification Service with Push Notifications
class NotificationService {
  constructor() {
    this.isSupported = "Notification" in window && "serviceWorker" in navigator;
    this.permission = Notification.permission;
    this.registration = null;
    this.subscription = null;
    this.listeners = new Set();
  }

  // Initialize the notification service
  async initialize() {
    if (!this.isSupported) {
      console.warn("⚠️ Push notifications not supported in this browser");
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register("/sw.js");
      console.log("🔧 Service Worker registered successfully");

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      return true;
    } catch (error) {
      console.error("❌ Service Worker registration failed:", error);
      return false;
    }
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error("Notifications not supported");
    }

    if (this.permission === "granted") {
      return true;
    }

    if (this.permission === "denied") {
      throw new Error(
        "Notifications are blocked. Please enable them in browser settings.",
      );
    }

    // Request permission
    const permission = await Notification.requestPermission();
    this.permission = permission;

    if (permission === "granted") {
      console.log("✅ Notification permission granted");
      return true;
    } else if (permission === "denied") {
      throw new Error("Notification permission denied");
    } else {
      throw new Error("Notification permission dismissed");
    }
  }

  // Subscribe to push notifications
  async subscribeToPush(userId) {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      throw new Error("Service Worker not registered");
    }

    try {
      // Check for existing subscription
      let subscription = await this.registration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            this.getVapidPublicKey(),
          ),
        });
      }

      this.subscription = subscription;

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription, userId);

      console.log("🔔 Push subscription successful");
      return subscription;
    } catch (error) {
      console.error("❌ Push subscription failed:", error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPush() {
    if (!this.subscription) return;

    try {
      await this.subscription.unsubscribe();
      await this.removeSubscriptionFromServer(this.subscription);
      this.subscription = null;
      console.log("🔕 Push unsubscription successful");
    } catch (error) {
      console.error("❌ Push unsubscription failed:", error);
      throw error;
    }
  }

  // Send subscription to your backend
  async sendSubscriptionToServer(subscription, userId) {
    try {
      const response = await fetch("/api/push-notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          subscription,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save subscription on server");
      }
    } catch (error) {
      console.error("❌ Failed to send subscription to server:", error);
      // Don't throw here to avoid breaking the subscription process
    }
  }

  // Remove subscription from server
  async removeSubscriptionFromServer(subscription) {
    try {
      await fetch("/api/push-notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ subscription }),
      });
    } catch (error) {
      console.error("❌ Failed to remove subscription from server:", error);
    }
  }

  // Show local notification
  showLocalNotification(title, options = {}) {
    if (this.permission !== "granted") {
      console.warn("⚠️ Cannot show notification: permission not granted");
      return;
    }

    const defaultOptions = {
      icon: "/new1.PNG",
      badge: "/new1.PNG",
      vibrate: [200, 100, 200],
      tag: "nile-flow-local",
      requireInteraction: false,
      ...options,
    };

    return new Notification(title, defaultOptions);
  }

  // Add notification listener
  addListener(callback) {
    this.listeners.add(callback);
  }

  // Remove notification listener
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  // Notify all listeners
  notifyListeners(notification) {
    this.listeners.forEach((callback) => {
      try {
        callback(notification);
      } catch (error) {
        console.error("❌ Notification listener error:", error);
      }
    });
  }

  // Get VAPID public key (you'll need to generate this)
  getVapidPublicKey() {
    // This is a placeholder - you'll need to generate your own VAPID keys
    // and replace this with your public key
    return "BEl62iUYgUivxIkv69yViEuiBIa40HI0DLhNA0N4PZkOhIQzMw0qhbZAGcJq7SXjM9RgON7Lp-E3TAqvbYmhvg4";
  }

  // Convert VAPID key to Uint8Array
  urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Check if notifications are supported and enabled
  isNotificationsEnabled() {
    return this.isSupported && this.permission === "granted";
  }

  // Get notification status
  getStatus() {
    return {
      supported: this.isSupported,
      permission: this.permission,
      subscribed: !!this.subscription,
      enabled: this.isNotificationsEnabled(),
    };
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
