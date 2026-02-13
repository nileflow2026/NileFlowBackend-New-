/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import axiosClient from "../../api";
import { getCustomerNotification } from "../../CustomerServices";
import { useNotification } from "../../Context/NotificationContext";
import Header from "../../components/Header";
import {
  Bell,
  BellRing,
  Check,
  Clock,
  Sparkles,
  Award,
  Shield,
  Truck,
  Eye,
  EyeOff,
  Filter,
  Trash2,
  Settings,
  Volume2,
  VolumeX,
  Globe,
  Star,
  Zap,
  MessageSquare,
} from "lucide-react";
import Footer from "../../components/Footer";
import { getCurrentUser } from "../../authServices";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const { setNotificationCount } = useNotification();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread, important, promotions
  const [showSettings, setShowSettings] = useState(false);
  const [muteSound, setMuteSound] = useState(false);
  const [readAll, setReadAll] = useState(false);

  useEffect(() => {
    const initNotifications = async () => {
      try {
        const user = await getCurrentUser();
        if (!user || !user.id) {
          setLoading(false);
          return;
        }

        const notificationsData = await getCustomerNotification();
        setNotifications(notificationsData);
        setNotificationCount(notificationsData.length);

        // Mark notifications as read after fetching
        await axiosClient.post("/api/customernotifications/mark-read", {});
        setNotificationCount(0);
      } catch (error) {
        console.error("❌ Failed to fetch notifications:", error.message);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    initNotifications();
  }, [setNotificationCount]);

  const handleMarkAsRead = async (notificationId) => {
    setNotifications((prev) =>
      prev.map((note) =>
        note.$id === notificationId ? { ...note, read: true } : note,
      ),
    );

    try {
      await axiosClient.post(
        `/api/customernotifications/${notificationId}/read`,
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((note) => ({ ...note, read: true })));
    setReadAll(true);

    try {
      await axiosClient.post("/api/customernotifications/mark-all-read");
      setNotificationCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    setNotifications((prev) =>
      prev.filter((note) => note.$id !== notificationId),
    );

    try {
      await axiosClient.delete(`/api/customernotifications/${notificationId}`);
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleClearAll = async () => {
    setNotifications([]);

    try {
      await axiosClient.post("/api/customernotifications/clear-all");
      setNotificationCount(0);
    } catch (error) {
      console.error("Failed to clear all:", error);
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.read;
    if (filter === "important") return notification.priority === "high";
    if (filter === "promotions") return notification.type === "promotion";
    return true;
  });

  const getNotificationIcon = (type, priority) => {
    if (priority === "high")
      return <BellRing className="w-5 h-5 text-red-400" />;
    if (type === "order") return <Truck className="w-5 h-5 text-amber-400" />;
    if (type === "promotion")
      return <Zap className="w-5 h-5 text-yellow-400" />;
    if (type === "message")
      return <MessageSquare className="w-5 h-5 text-blue-400" />;
    return <Bell className="w-5 h-5 text-emerald-400" />;
  };

  const getNotificationColor = (type, priority) => {
    if (priority === "high") return "from-red-600/20 to-red-800/10";
    if (type === "order") return "from-amber-600/20 to-yellow-800/10";
    if (type === "promotion") return "from-yellow-600/20 to-orange-800/10";
    if (type === "message") return "from-blue-600/20 to-indigo-800/10";
    return "from-emerald-600/20 to-green-800/10";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header />

      {/* Hero Section */}
      <div className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-gray-900/20 to-emerald-900/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-red-500/10 to-amber-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

        <div className="relative max-w-8xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-6">
            <Bell className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide">
              Premium Alerts
            </span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
              Notifications
            </span>
            <br />
            <span className="text-white">Stay Updated</span>
          </h1>

          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
            Get real-time updates on your orders, exclusive deals, and premium
            African product launches
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-amber-300">
                {notifications.length}
              </div>
              <div className="text-amber-100/80 text-sm">Total Alerts</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-emerald-300">
                {notifications.filter((n) => !n.read).length}
              </div>
              <div className="text-emerald-100/80 text-sm">Unread</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-blue-300">24/7</div>
              <div className="text-blue-100/80 text-sm">Real-time</div>
            </div>
            <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-4">
              <div className="text-2xl font-bold text-red-300">100%</div>
              <div className="text-red-100/80 text-sm">Secure</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-8xl mx-auto">
          {/* Controls Bar */}
          <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-5 py-3 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                    filter === "all"
                      ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-500 shadow-lg shadow-amber-900/30"
                      : "bg-gradient-to-r from-gray-900/50 to-black/50 border-amber-800/30 text-gray-300 hover:border-amber-500/50"
                  }`}
                >
                  All Notifications
                </button>
                <button
                  onClick={() => setFilter("unread")}
                  className={`px-5 py-3 rounded-xl border backdrop-blur-sm transition-all duration-300 flex items-center space-x-2 ${
                    filter === "unread"
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-emerald-500 shadow-lg shadow-emerald-900/30"
                      : "bg-gradient-to-r from-gray-900/50 to-black/50 border-amber-800/30 text-gray-300 hover:border-amber-500/50"
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>Unread</span>
                </button>
                <button
                  onClick={() => setFilter("important")}
                  className={`px-5 py-3 rounded-xl border backdrop-blur-sm transition-all duration-300 flex items-center space-x-2 ${
                    filter === "important"
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white border-red-500 shadow-lg shadow-red-900/30"
                      : "bg-gradient-to-r from-gray-900/50 to-black/50 border-amber-800/30 text-gray-300 hover:border-amber-500/50"
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>Important</span>
                </button>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm border border-amber-700/40 rounded-xl hover:border-amber-500/60 transition-all duration-300"
                >
                  <Settings className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-200 font-medium">Settings</span>
                </button>

                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300"
                >
                  <Check className="w-5 h-5" />
                  <span>Mark All Read</span>
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="mt-6 pt-6 border-t border-amber-800/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-amber-200 font-bold">
                        Notification Sound
                      </h4>
                      <button
                        onClick={() => setMuteSound(!muteSound)}
                        className={`p-2 rounded-lg ${
                          muteSound ? "bg-red-900/30" : "bg-emerald-900/30"
                        }`}
                      >
                        {muteSound ? (
                          <VolumeX className="w-5 h-5 text-red-400" />
                        ) : (
                          <Volume2 className="w-5 h-5 text-emerald-400" />
                        )}
                      </button>
                    </div>
                    <p className="text-amber-100/70 text-sm">
                      {muteSound ? "Sounds are muted" : "Sounds are enabled"}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-4">
                    <h4 className="text-amber-200 font-bold mb-4">Filter By</h4>
                    <div className="space-y-2">
                      {[
                        "All",
                        "Orders",
                        "Promotions",
                        "Messages",
                        "System",
                      ].map((type) => (
                        <div key={type} className="flex items-center space-x-3">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-emerald-500"></div>
                          <span className="text-amber-100/70 text-sm">
                            {type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-4">
                    <h4 className="text-amber-200 font-bold mb-4">
                      Quick Actions
                    </h4>
                    <div className="space-y-3">
                      <button
                        onClick={handleClearAll}
                        className="w-full px-4 py-2 bg-gradient-to-r from-red-900/30 to-red-800/20 border border-red-700/30 rounded-lg text-red-200 hover:border-red-500/50 transition-all duration-300 flex items-center justify-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Clear All Notifications</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-amber-900/30 border-t-amber-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Bell className="w-10 h-10 text-amber-500 animate-pulse" />
                </div>
              </div>
              <h3 className="mt-8 text-2xl font-bold text-amber-200">
                Loading Notifications
              </h3>
              <p className="text-gray-400 mt-2">
                Fetching your premium alerts...
              </p>
            </div>
          ) : (
            <>
              {/* Notifications List */}
              <div className="space-y-4">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.$id}
                      className={`group relative bg-gradient-to-br ${getNotificationColor(
                        notification.type,
                        notification.priority,
                      )} backdrop-blur-sm border rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02] ${
                        notification.read
                          ? "border-amber-800/30"
                          : "border-amber-500/50 shadow-lg shadow-amber-900/30"
                      }`}
                    >
                      {/* Notification Content */}
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Icon */}
                          <div
                            className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                              notification.read
                                ? "bg-gradient-to-br from-gray-900 to-black border border-amber-800/30"
                                : "bg-gradient-to-br from-amber-600 to-amber-700"
                            }`}
                          >
                            {getNotificationIcon(
                              notification.type,
                              notification.priority,
                            )}
                          </div>

                          {/* Message */}
                          <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3
                                  className={`text-lg font-bold ${
                                    notification.read
                                      ? "text-gray-300"
                                      : "text-white"
                                  }`}
                                >
                                  {notification.message}
                                </h3>
                                <p className="text-gray-400 mt-2 text-sm">
                                  {notification.description ||
                                    "Premium African marketplace update"}
                                </p>
                              </div>

                              <div className="flex flex-col items-end space-y-3">
                                <div className="flex items-center space-x-2 text-amber-100/70 text-sm">
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    {new Date(
                                      notification.timestamp ||
                                        notification.$createdAt,
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>

                                {!notification.read && (
                                  <div className="flex items-center space-x-1 bg-gradient-to-r from-amber-900/40 to-yellow-900/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-amber-700/30">
                                    <span className="text-xs font-bold text-amber-200">
                                      NEW
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-4 mt-6">
                              {!notification.read && (
                                <button
                                  onClick={() =>
                                    handleMarkAsRead(notification.$id)
                                  }
                                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300"
                                >
                                  <Check className="w-4 h-4" />
                                  <span className="text-sm">Mark as Read</span>
                                </button>
                              )}

                              <button
                                onClick={() =>
                                  handleDeleteNotification(notification.$id)
                                }
                                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-900/30 to-red-800/20 border border-red-700/30 rounded-xl text-red-200 hover:border-red-500/50 hover:bg-red-900/40 transition-all duration-300"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-sm">Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status Indicator */}
                      <div className="absolute top-6 right-6">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            notification.read
                              ? "bg-gray-600"
                              : "bg-gradient-to-r from-amber-500 to-emerald-500 animate-pulse"
                          }`}
                        ></div>
                      </div>

                      {/* Hover Actions */}
                      <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex items-center space-x-2">
                          <button className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-700/30 flex items-center justify-center text-amber-400 hover:text-amber-300 hover:scale-110 transition-all">
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-32">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-900/30 to-emerald-900/30 border border-amber-700/30 mb-6">
                      <Bell className="w-12 h-12 text-amber-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">
                      No Notifications
                    </h3>
                    <p className="text-gray-400 max-w-md mx-auto mb-8">
                      {filter === "all"
                        ? "You're all caught up! Check back later for updates on your orders and exclusive African product deals."
                        : `No ${filter} notifications at the moment.`}
                    </p>
                    {filter !== "all" && (
                      <button
                        onClick={() => setFilter("all")}
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
                      >
                        <span>View All Notifications</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Trust Badges */}
              <div className="mt-16">
                {/* Mobile: Horizontal Scroll, Desktop: Grid */}
                <div className="flex overflow-x-auto gap-6 pb-4 lg:grid lg:grid-cols-4 lg:overflow-visible scrollbar-thin scrollbar-thumb-amber-600 scrollbar-track-amber-900/20">
                  <div className="bg-gradient-to-br from-amber-900/20 to-transparent backdrop-blur-sm border border-amber-800/30 rounded-2xl p-6 text-center flex-shrink-0 min-w-[280px] lg:min-w-0">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 mb-4">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xl font-bold text-amber-300 mb-2">
                      Secure Alerts
                    </div>
                    <div className="text-amber-100/80 text-sm">
                      Encrypted notifications
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-900/20 to-transparent backdrop-blur-sm border border-emerald-800/30 rounded-2xl p-6 text-center flex-shrink-0 min-w-[280px] lg:min-w-0">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 mb-4">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xl font-bold text-emerald-300 mb-2">
                      Real-time Updates
                    </div>
                    <div className="text-emerald-100/80 text-sm">
                      Instant African market news
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-900/20 to-transparent backdrop-blur-sm border border-blue-800/30 rounded-2xl p-6 text-center flex-shrink-0 min-w-[280px] lg:min-w-0">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mb-4">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xl font-bold text-blue-300 mb-2">
                      Priority Support
                    </div>
                    <div className="text-blue-100/80 text-sm">
                      24/7 customer service
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-900/20 to-transparent backdrop-blur-sm border border-red-800/30 rounded-2xl p-6 text-center flex-shrink-0 min-w-[280px] lg:min-w-0">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 mb-4">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xl font-bold text-red-300 mb-2">
                      Instant Delivery
                    </div>
                    <div className="text-red-100/80 text-sm">
                      Order updates in seconds
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotificationsPage;
