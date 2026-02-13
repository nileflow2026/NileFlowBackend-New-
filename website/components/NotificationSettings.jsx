import React, { useState, useEffect } from "react";
import { useNotification } from "../Context/NotificationContext";
import {
  Bell,
  BellOff,
  Settings,
  Check,
  X,
  AlertCircle,
  Smartphone,
  Monitor,
  Volume2,
  VolumeX,
  Shield,
  Info,
} from "lucide-react";

const NotificationSettings = ({ isOpen, onClose }) => {
  const {
    isNotificationsEnabled,
    enableNotifications,
    disableNotifications,
  } = useNotification();

  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [desktopEnabled, setDesktopEnabled] = useState(isNotificationsEnabled);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(true);
  const [security, setSecurity] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setDesktopEnabled(isNotificationsEnabled);
  }, [isNotificationsEnabled]);

  const handleToggleDesktopNotifications = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isNotificationsEnabled) {
        await disableNotifications();
        setDesktopEnabled(false);
        setSuccess("Desktop notifications disabled");
      } else {
        await enableNotifications();
        setDesktopEnabled(true);
        setSuccess(
          "Desktop notifications enabled! You'll receive real-time updates.",
        );
      }
    } catch (err) {
      setError(err.message || "Failed to update notification settings");
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = () => {
    if (isNotificationsEnabled) {
      // Create test notification
      const testNotification = new Notification("Test Notification", {
        body: "This is how your notifications will look!",
        icon: "/new1.PNG",
        tag: "test-notification",
        requireInteraction: false,
      });

      setTimeout(() => {
        testNotification.close();
      }, 4000);

      setSuccess("Test notification sent!");
    } else {
      setError("Please enable desktop notifications first");
    }
  };

  const getPermissionStatus = () => {
    if (!("Notification" in window)) {
      return { text: "Not Supported", color: "text-red-400", icon: X };
    }

    switch (Notification.permission) {
      case "granted":
        return { text: "Enabled", color: "text-emerald-400", icon: Check };
      case "denied":
        return { text: "Blocked", color: "text-red-400", icon: X };
      default:
        return { text: "Not Set", color: "text-amber-400", icon: AlertCircle };
    }
  };

  const permissionStatus = getPermissionStatus();
  const StatusIcon = permissionStatus.icon;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-gray-900 to-black border border-amber-800/30 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-amber-900/20 to-emerald-900/20 backdrop-blur-sm border-b border-amber-800/30 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-amber-200">
                  Notification Settings
                </h2>
                <p className="text-amber-100/70 text-sm">
                  Manage your real-time alerts
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-amber-400 hover:text-amber-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Messages */}
          {error && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-4 flex items-center space-x-3">
              <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <p className="text-emerald-200 text-sm">{success}</p>
            </div>
          )}

          {/* Browser Permission Status */}
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-amber-800/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-amber-200 flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Browser Permissions</span>
              </h3>
              <div
                className={`flex items-center space-x-2 ${permissionStatus.color}`}
              >
                <StatusIcon className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {permissionStatus.text}
                </span>
              </div>
            </div>
            <p className="text-amber-100/70 text-sm mb-4">
              Your browser permission status for receiving notifications
            </p>
            {Notification.permission === "denied" && (
              <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
                <p className="text-red-200 text-sm">
                  Notifications are blocked. To enable them, click the lock icon
                  in your browser address bar and allow notifications for this
                  site.
                </p>
              </div>
            )}
          </div>

          {/* Desktop Notifications */}
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-amber-800/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-200">
                    Desktop Notifications
                  </h3>
                  <p className="text-blue-100/70 text-sm">
                    Receive alerts even when the browser is closed
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleDesktopNotifications}
                disabled={loading || Notification.permission === "denied"}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                  desktopEnabled ? "bg-emerald-600" : "bg-gray-600"
                } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    desktopEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {desktopEnabled && (
              <button
                onClick={handleTestNotification}
                className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
              >
                Send Test Notification
              </button>
            )}
          </div>

          {/* Notification Types */}
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-amber-800/30 rounded-xl p-6">
            <h3 className="text-lg font-bold text-amber-200 mb-4 flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Notification Types</span>
            </h3>
            <div className="space-y-4">
              {/* Order Updates */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-emerald-200 font-medium">
                      Order Updates
                    </p>
                    <p className="text-emerald-100/70 text-sm">
                      Shipping, delivery, and order status
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOrderUpdates(!orderUpdates)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                    orderUpdates ? "bg-emerald-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      orderUpdates ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Promotions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-amber-200 font-medium">
                      Promotions & Deals
                    </p>
                    <p className="text-amber-100/70 text-sm">
                      Exclusive offers and discounts
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPromotions(!promotions)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                    promotions ? "bg-emerald-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      promotions ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Security */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-red-200 font-medium">Security Alerts</p>
                    <p className="text-red-100/70 text-sm">
                      Account security and login notifications
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSecurity(!security)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                    security ? "bg-emerald-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      security ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Sound Settings */}
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-amber-800/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
                  {soundEnabled ? (
                    <Volume2 className="w-5 h-5 text-white" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-purple-200">
                    Notification Sounds
                  </h3>
                  <p className="text-purple-100/70 text-sm">
                    Play sound when receiving notifications
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                  soundEnabled ? "bg-emerald-600" : "bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    soundEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-gradient-to-br from-blue-900/20 to-transparent border border-blue-800/30 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-blue-200 font-medium mb-2">
                  About Real-time Notifications
                </h4>
                <div className="text-blue-100/70 text-sm space-y-2">
                  <p>• Notifications work even when your browser is closed</p>
                  <p>
                    • You can manage permissions anytime in browser settings
                  </p>
                  <p>• All notifications are secure and respect your privacy</p>
                  <p>• You can disable specific types of notifications above</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-amber-800/30 p-6">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-900/50 border border-amber-800/30 rounded-lg text-amber-300 hover:text-amber-200 hover:border-amber-500/50 transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
