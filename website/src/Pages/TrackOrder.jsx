/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { client, Config, databases } from "../../appwrite";
import axiosClient from "../../api";
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  Home,
  MapPin,
  Shield,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Award,
  Bell,
  Navigation,
  Calendar,
  FileText,
  User,
  Phone,
  CreditCard,
} from "lucide-react";
import customerTrackingService from "../../services/customerTrackingService";

const TrackOrder = ({ orderId, estimatedDelivery, orderTime, userId }) => {
  const [orderStatus, setOrderStatus] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [liveLocation, setLiveLocation] = useState("Processing Center");
  const [locationData, setLocationData] = useState({
    currentLatitude: null,
    currentLongitude: null,
    deliveryAddress: null,
    pickupAddress: null,
    deliveryStatus: null,
  });
  const [driverInfo, setDriverInfo] = useState({
    name: "Assigning Driver...",
    phone: "N/A",
    vehicle: "N/A",
    rating: null,
    avatar: null,
  });
  const [orderData, setOrderData] = useState(null);

  // Real-time tracking states
  const [isLiveTrackingActive, setIsLiveTrackingActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [lastLocationUpdate, setLastLocationUpdate] = useState(null);
  const [realTimeStatus, setRealTimeStatus] = useState(null);

  // Error and loading states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [hasNoOrders, setHasNoOrders] = useState(false);

  useEffect(() => {
    console.log(
      "TrackOrder useEffect running, orderId:",
      orderId,
      "userId:",
      userId
    );

    if (!orderId || !userId) {
      console.log("Missing orderId or userId, exiting useEffect");
      return;
    }

    // Initialize tracking
    initializeTracking();

    return () => {
      // Cleanup WebSocket connection
      customerTrackingService.disconnect();
      console.log("🧹 Disconnected from live tracking");
    };
  }, [orderId, userId]);

  const initializeTracking = async () => {
    try {
      // 1. Fetch initial order data
      await fetchInitialStatus();

      // 2. Initialize WebSocket connection for real-time updates
      setupWebSocketConnection();
    } catch (error) {
      console.error("Error initializing tracking:", error);
    }
  };

  const setupWebSocketConnection = () => {
    console.log("🔗 Setting up WebSocket connection for live tracking");

    // Connect to WebSocket server
    customerTrackingService.connect(orderId, userId);

    // Set up event listeners for real-time updates
    customerTrackingService.on("connected", handleTrackingConnected);
    customerTrackingService.on("tracking-ready", handleTrackingReady);
    customerTrackingService.on("location-update", handleRealTimeLocationUpdate);
    customerTrackingService.on("delivery-started", handleDeliveryStarted);
    customerTrackingService.on("delivery-completed", handleDeliveryCompleted);
    customerTrackingService.on("status-update", handleRealTimeStatusUpdate);
    customerTrackingService.on("disconnected", handleTrackingDisconnected);
    customerTrackingService.on("connection-error", handleConnectionError);
    customerTrackingService.on("reconnected", handleReconnected);
  };

  const fetchInitialStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching initial status for orderId:", orderId);
      const response = await axiosClient.get(`/api/orders/tracking/${orderId}`);
      console.log("Initial Order Status fetched:", response.data);

      if (response.data.success) {
        const orderData = response.data.data;

        setOrderStatus(orderData.orderStatus || "Pending");
        setOrderData(orderData);
        updateStep(orderData.orderStatus);

        // Update driver info from API response
        updateDriverInfo(orderData);

        // Fetch live location data
        await fetchLiveLocation();
      } else {
        console.log("API returned success: false", response.data);
        setError(response.data.message || "Order not found");
        setHasNoOrders(true);
      }
    } catch (error) {
      console.error("Error fetching initial order status:", error);

      // Handle specific error status codes
      if (error.response?.status === 401) {
        setIsUnauthorized(true);
        setError("Please sign in to track your orders");
      } else if (error.response?.status === 404) {
        setHasNoOrders(true);
        setError(
          "Order not found. Make sure you have placed an order to track."
        );
      } else {
        setError(
          "Failed to load order tracking information. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLiveLocation = async () => {
    try {
      console.log("Fetching live location for orderId:", orderId);
      const response = await axiosClient.get(
        `/api/orders/tracking/${orderId}/location`
      );

      if (response.data.success) {
        const locationInfo = response.data.data;
        updateLocationData(locationInfo);
      }
    } catch (error) {
      console.error("Error fetching live location:", error);
      updateLiveLocationByStatus(orderStatus);
    }
  };

  const updateDriverInfo = (orderData) => {
    if (orderData.riderDetails) {
      setDriverInfo({
        name: orderData.riderDetails.name || "Driver Assigned",
        phone: orderData.riderDetails.phone || "N/A",
        vehicle: "Delivery Vehicle",
        rating: orderData.riderDetails.rating || null,
        avatar: orderData.riderDetails.avatar || null,
        status: orderData.riderDetails.status || "active",
      });
    } else if (orderData.riderName || orderData.riderPhone) {
      setDriverInfo({
        name: orderData.riderName || "Driver Assigned",
        phone: orderData.riderPhone || "N/A",
        vehicle: "Delivery Vehicle",
        rating: null,
        avatar: null,
        status: "active",
      });
    }
  };

  const updateLocationData = (locationInfo) => {
    setLocationData({
      currentLatitude: locationInfo.currentLatitude,
      currentLongitude: locationInfo.currentLongitude,
      deliveryAddress: locationInfo.deliveryAddress,
      pickupAddress: locationInfo.pickupAddress,
      deliveryStatus: locationInfo.deliveryStatus,
    });

    // Update live location display based on real data
    if (locationInfo.deliveryAddress) {
      setLiveLocation(locationInfo.deliveryAddress);
    } else if (locationInfo.pickupAddress) {
      setLiveLocation(`Near ${locationInfo.pickupAddress}`);
    } else {
      updateLiveLocationByStatus(orderStatus);
    }
  };

  // WebSocket Event Handlers
  const handleTrackingConnected = (data) => {
    console.log("🔗 WebSocket connected for tracking:", data);
    setConnectionStatus("connected");
  };

  const handleTrackingReady = (data) => {
    console.log("✅ Live tracking ready:", data);
    setIsLiveTrackingActive(true);
    setConnectionStatus("tracking");
  };

  const handleRealTimeLocationUpdate = (locationData) => {
    console.log("📍 Real-time location update:", locationData);

    // Update location state with real-time data
    setLocationData((prev) => ({
      ...prev,
      currentLatitude: locationData.latitude,
      currentLongitude: locationData.longitude,
      deliveryStatus: locationData.status || prev.deliveryStatus,
    }));

    // Update live location display
    if (locationData.deliveryAddress) {
      setLiveLocation(locationData.deliveryAddress);
    } else if (locationData.pickupAddress) {
      setLiveLocation(`Near ${locationData.pickupAddress}`);
    } else {
      setLiveLocation("In transit");
    }

    setLastLocationUpdate(new Date());

    // Update status if included in location data
    if (locationData.status) {
      setRealTimeStatus(locationData.status);
      updateStep(locationData.status);
    }
  };

  const handleDeliveryStarted = (startData) => {
    console.log("🚀 Delivery started:", startData);
    setOrderStatus("picked_up");
    setRealTimeStatus("picked_up");
    updateStep("picked_up");
    setLiveLocation("Rider is on the way");

    // Update driver info if available
    if (startData.riderName) {
      setDriverInfo((prev) => ({
        ...prev,
        name: startData.riderName,
        status: "on_the_way",
      }));
    }
  };

  const handleDeliveryCompleted = (completionData) => {
    console.log("✅ Delivery completed:", completionData);
    setOrderStatus("delivered");
    setRealTimeStatus("delivered");
    updateStep("delivered");
    setLiveLocation("Delivered to your address");
    setIsLiveTrackingActive(false);
  };

  const handleRealTimeStatusUpdate = (statusData) => {
    console.log("📢 Real-time status update:", statusData);
    setRealTimeStatus(statusData.status);
    setOrderStatus(statusData.status);
    updateStep(statusData.status);
  };

  const handleTrackingDisconnected = (data) => {
    console.log("❌ Tracking disconnected:", data);
    setConnectionStatus("disconnected");
    setIsLiveTrackingActive(false);
  };

  const handleConnectionError = (error) => {
    console.log("⚠️ Connection error:", error);
    setConnectionStatus("error");
  };

  const handleReconnected = () => {
    console.log("🔄 Tracking reconnected");
    setConnectionStatus("tracking");
    setIsLiveTrackingActive(true);
  };

  const updateStep = (status) => {
    const steps = {
      Pending: 0,
      Processed: 1,
      Shipped: 2,
      "Out for Delivery": 3,
      picked_up: 3, // Map backend status to frontend step
      in_transit: 3,
      Delivered: 4,
      delivered: 4,
    };
    setCurrentStep(steps[status] || 0);
  };

  const updateLiveLocationByStatus = (status) => {
    const locations = {
      Pending: "Processing Center",
      Processed: "Warehouse Sorting",
      Shipped: "Distribution Center",
      "Out for Delivery": "In your neighborhood",
      picked_up: "Rider has picked up your order",
      in_transit: "On the way to your address",
      Delivered: "Delivered to your address",
      delivered: "Delivered to your address",
    };
    setLiveLocation(locations[status] || "Processing Center");
  };

  const trackingSteps = [
    {
      status: "Ordered",
      icon: <FileText className="w-5 h-5" />,
      description: "Order confirmed and received",
      time: orderTime,
    },
    {
      status: "Processed",
      icon: <Package className="w-5 h-5" />,
      description: "Items packed and ready for shipping",
      time: "2 hours after order",
    },
    {
      status: "Shipped",
      icon: <Truck className="w-5 h-5" />,
      description: "Dispatched from warehouse",
      time: "Same day shipping",
    },
    {
      status: "Out for Delivery",
      icon: <Navigation className="w-5 h-5" />,
      description: "On the way to your location",
      time: "Delivery day",
    },
    {
      status: "Delivered",
      icon: <Home className="w-5 h-5" />,
      description: "Successfully delivered",
      time: estimatedDelivery,
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered":
      case "delivered":
        return "from-emerald-600 to-green-600";
      case "Out for Delivery":
      case "picked_up":
      case "in_transit":
        return "from-blue-600 to-cyan-600";
      case "Shipped":
        return "from-purple-600 to-violet-600";
      case "Processed":
        return "from-amber-600 to-orange-600";
      default:
        return "from-gray-600 to-gray-700";
    }
  };

  const getConnectionStatusIndicator = () => {
    switch (connectionStatus) {
      case "tracking":
        return (
          <div className="flex items-center space-x-2 bg-gradient-to-r from-green-900/30 to-emerald-900/30 backdrop-blur-sm px-4 py-2 rounded-full border border-green-700/30">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm text-green-200">Live Tracking</span>
          </div>
        );
      case "connected":
        return (
          <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-700/30">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-sm text-blue-200">Connecting...</span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center space-x-2 bg-gradient-to-r from-red-900/30 to-pink-900/30 backdrop-blur-sm px-4 py-2 rounded-full border border-red-700/30">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-sm text-red-200">Connection Error</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-2 bg-gradient-to-r from-gray-900/30 to-gray-800/30 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-700/30">
            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
            <span className="text-sm text-gray-300">Offline</span>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 p-4 sm:p-6">
      {/* Header */}
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-amber-700/30 mb-4">
            <Package className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-medium tracking-wide">
              Real-Time Tracking
            </span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-200 bg-clip-text text-transparent">
              Track Your Order
            </span>
          </h1>

          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Live location updates with real-time WebSocket tracking
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-400 mb-6"></div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Loading Order Information
            </h3>
            <p className="text-gray-400 text-center max-w-md">
              We're fetching your order details and tracking information...
            </p>
          </div>
        )}

        {/* Unauthorized State (401 Error) */}
        {isUnauthorized && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-gradient-to-br from-red-900/40 to-orange-900/40 backdrop-blur-sm border border-red-700/30 rounded-3xl p-8 max-w-md w-full text-center">
              <User className="w-16 h-16 text-red-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">
                Please Sign In
              </h3>
              <p className="text-gray-300 mb-6">
                You need to be signed in to track your orders. Please sign in to
                continue.
              </p>
              <div className="space-y-3">
                <Link
                  to="/signin"
                  className="block w-full px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="block w-full px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white font-semibold rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 border border-gray-600"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* No Orders State (404 or no data) */}
        {(hasNoOrders || (error && !isUnauthorized)) && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-8 max-w-md w-full text-center">
              <Package className="w-16 h-16 text-amber-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">
                No Orders to Track
              </h3>
              <p className="text-gray-300 mb-6">
                {error ||
                  "You don't have any orders to track yet. Make an order to start tracking your delivery!"}
              </p>
              <div className="space-y-3">
                <Link
                  to="/shop"
                  className="block w-full px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300"
                >
                  Start Shopping
                </Link>
                <Link
                  to="/orders"
                  className="block w-full px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white font-semibold rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 border border-gray-600"
                >
                  View All Orders
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Main Tracking Interface - Only show if no errors and not loading */}
        {!isLoading && !isUnauthorized && !hasNoOrders && !error && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Order Status Card */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Order #{orderId}
                    </h2>
                    <p className="text-amber-100/70">
                      Premium African Products
                    </p>
                  </div>
                  <div
                    className={`bg-gradient-to-r ${getStatusColor(
                      realTimeStatus || orderStatus
                    )} text-white px-4 py-2 rounded-full font-bold`}
                  >
                    {realTimeStatus || orderStatus || "Tracking..."}
                  </div>
                </div>

                {/* Tracking Timeline - Same as your original */}
                <div className="relative">
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-800">
                    <div
                      className="absolute top-0 left-0 w-0.5 bg-gradient-to-b from-amber-500 to-emerald-500 transition-all duration-1000"
                      style={{
                        height: `${
                          (currentStep / (trackingSteps.length - 1)) * 100
                        }%`,
                      }}
                    ></div>
                  </div>

                  <div className="space-y-8">
                    {trackingSteps.map((step, index) => (
                      <div key={step.status} className="relative">
                        <div
                          className={`flex items-start space-x-4 ${
                            index <= currentStep ? "opacity-100" : "opacity-50"
                          }`}
                        >
                          <div
                            className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center ${
                              index <= currentStep
                                ? "bg-gradient-to-br from-amber-600 to-amber-700"
                                : "bg-gradient-to-br from-gray-800 to-black border border-amber-800/30"
                            }`}
                          >
                            <div
                              className={`${
                                index <= currentStep
                                  ? "text-white"
                                  : "text-amber-400"
                              }`}
                            >
                              {step.icon}
                            </div>
                            {index < currentStep && (
                              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-emerald-600 to-green-600 flex items-center justify-center">
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 pt-1">
                            <div className="flex items-center justify-between">
                              <h3
                                className={`text-xl font-bold ${
                                  index <= currentStep
                                    ? "text-white"
                                    : "text-gray-400"
                                }`}
                              >
                                {step.status}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-amber-400" />
                                <span className="text-sm text-amber-100/70">
                                  {step.time}
                                </span>
                              </div>
                            </div>
                            <p
                              className={`mt-1 ${
                                index <= currentStep
                                  ? "text-gray-300"
                                  : "text-gray-500"
                              }`}
                            >
                              {step.description}
                            </p>
                            {index === currentStep && (
                              <div className="inline-flex items-center space-x-2 mt-3 bg-gradient-to-r from-amber-900/30 to-yellow-900/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-amber-700/30">
                                <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                                <span className="text-xs text-amber-200">
                                  {isLiveTrackingActive
                                    ? "Live tracking"
                                    : "In progress"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Tracking Map - Enhanced with real-time status */}
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                      <Navigation className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Live Tracking
                      </h3>
                      <p className="text-blue-100/70">
                        Real-time WebSocket updates
                      </p>
                    </div>
                  </div>
                  {getConnectionStatusIndicator()}
                </div>

                {/* Map Visualization - Same as your original */}
                <div className="relative h-48 bg-gradient-to-br from-gray-900 to-black border border-amber-800/30 rounded-xl overflow-hidden mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-cyan-900/20"></div>

                  <div className="absolute left-1/4 top-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-amber-500 to-emerald-500"></div>

                  <div className="absolute left-1/4 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 flex items-center justify-center shadow-lg">
                      <Truck className="w-4 h-4 text-white" />
                      {isLiveTrackingActive && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 animate-ping"></div>
                      )}
                    </div>
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                      <span className="text-xs text-white bg-black/50 px-2 py-1 rounded-full">
                        {liveLocation}
                      </span>
                    </div>
                  </div>

                  <div className="absolute right-1/4 top-1/2 transform translate-x-1/2 -translate-y-1/2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-600 to-green-600 flex items-center justify-center shadow-lg">
                      <Home className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                      <span className="text-xs text-white bg-black/50 px-2 py-1 rounded-full">
                        {locationData.deliveryAddress ||
                          orderData?.shippingAddress ||
                          "Your Address"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-amber-100/70">
                          Estimated Delivery
                        </p>
                        <p className="text-lg font-bold text-white">
                          {estimatedDelivery}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-100/70">
                          Current Location
                        </p>
                        <p className="text-lg font-bold text-white truncate">
                          {liveLocation}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-emerald-100/70">
                          {lastLocationUpdate ? "Last Update" : "Order Date"}
                        </p>
                        <p className="text-lg font-bold text-white">
                          {lastLocationUpdate
                            ? lastLocationUpdate.toLocaleTimeString()
                            : orderTime}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Same as your original but with live tracking status */}
            <div className="space-y-6">
              {/* Driver Info */}
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Your Driver
                    </h3>
                    <p className="text-purple-100/70">
                      {isLiveTrackingActive
                        ? "Live tracking active"
                        : "Premium delivery partner"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl">
                    <span className="text-gray-300">Name</span>
                    <span className="text-white font-bold">
                      {driverInfo.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl">
                    <span className="text-gray-300">Contact</span>
                    {driverInfo.phone !== "N/A" ? (
                      <a
                        href={`tel:${driverInfo.phone}`}
                        className="text-amber-300 font-bold hover:text-amber-200"
                      >
                        {driverInfo.phone}
                      </a>
                    ) : (
                      <span className="text-gray-400">{driverInfo.phone}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl">
                    <span className="text-gray-300">Vehicle</span>
                    <span className="text-emerald-300 font-bold">
                      {driverInfo.vehicle}
                    </span>
                  </div>

                  {driverInfo.rating && (
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl">
                      <span className="text-gray-300">Rating</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-yellow-400 font-bold">
                          {driverInfo.rating}
                        </span>
                        <span className="text-yellow-400">⭐</span>
                      </div>
                    </div>
                  )}
                </div>

                {driverInfo.phone !== "N/A" ? (
                  <button
                    onClick={() => window.open(`tel:${driverInfo.phone}`)}
                    className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <Phone className="w-5 h-5" />
                    <span>Call Driver</span>
                  </button>
                ) : (
                  <div className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 font-bold rounded-xl flex items-center justify-center space-x-2 cursor-not-allowed">
                    <Phone className="w-5 h-5" />
                    <span>Driver Not Assigned</span>
                  </div>
                )}
              </div>

              {/* Rest of your sidebar components remain the same */}
              {/* Order Summary */}
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Order Summary
                    </h3>
                    <p className="text-emerald-100/70">Premium package</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">
                      Items ({orderData?.items?.length || 0})
                    </span>
                    <span className="text-white font-bold">
                      {orderData?.subtotal || orderData?.amount || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Shipping</span>
                    <span className="text-emerald-300 font-bold">
                      {orderData?.shippingFee > 0
                        ? orderData.shippingFee
                        : "FREE"}
                    </span>
                  </div>
                  {orderData?.premiumDiscountAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Premium Discount</span>
                      <span className="text-emerald-300 font-bold">
                        -{orderData.premiumDiscountAmount}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-amber-800/30 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-lg text-white font-bold">
                        Total
                      </span>
                      <span className="text-2xl text-amber-300 font-bold">
                        {orderData?.amount || "0.00"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Card */}
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-amber-800/30 rounded-3xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="w-8 h-8 text-amber-400" />
                  <h3 className="text-lg font-bold text-white">
                    Premium Support
                  </h3>
                </div>

                <p className="text-gray-300 text-sm mb-6">
                  Our premium support team is available 24/7 to assist with your
                  order.
                </p>

                <div className="space-y-3">
                  <button className="w-full px-4 py-3 bg-gradient-to-r from-gray-800 to-black border border-amber-800/30 text-amber-300 rounded-xl hover:border-amber-500/50 transition-all duration-300 flex items-center justify-between">
                    <span>Get Help</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <button className="w-full px-4 py-3 bg-gradient-to-r from-amber-900/30 to-yellow-900/30 backdrop-blur-sm border border-amber-700/30 text-amber-200 rounded-xl hover:border-amber-500/50 transition-all duration-300 flex items-center justify-between">
                    <span>Update Delivery</span>
                    <Bell className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Trust Badge - Enhanced with live tracking badge */}
              <div className="bg-gradient-to-br from-emerald-900/20 to-green-900/20 backdrop-blur-sm border border-emerald-800/30 rounded-3xl p-6 text-center">
                <Award className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-white mb-2">
                  {isLiveTrackingActive
                    ? "Live Tracking Active"
                    : "Premium Guarantee"}
                </h4>
                <p className="text-emerald-100/70 text-sm">
                  {isLiveTrackingActive
                    ? "Real-time location updates via WebSocket connection"
                    : "Your order is protected with our premium delivery guarantee"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;
