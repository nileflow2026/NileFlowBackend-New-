// components/RiderDeliveryMap.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  Navigation,
  MapPin,
  Play,
  CheckCircle,
  AlertTriangle,
  Truck,
  Clock,
  Route,
  Target,
} from "lucide-react";
import { riderTrackingService } from "../services/riderTrackingService";

const RiderDeliveryMap = ({ delivery, riderId, authToken, onStatusUpdate }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [deliveryStatus, setDeliveryStatus] = useState(delivery.status);
  const [routeInfo, setRouteInfo] = useState(null);
  const [lastLocationUpdate, setLastLocationUpdate] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [error, setError] = useState(null);

  // Map visualization states
  const [mapCenter, setMapCenter] = useState(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    // Initialize rider tracking service
    if (riderId && authToken) {
      initializeTracking();
    }

    return () => {
      // Cleanup on unmount
      riderTrackingService.disconnect();
    };
  }, [delivery.$id, riderId, authToken]);

  const initializeTracking = () => {
    console.log("🚀 Initializing rider tracking for delivery:", delivery.$id);

    // Connect to WebSocket server
    riderTrackingService.connect(riderId, authToken);

    // Set up event listeners
    setupEventListeners();

    // Get current location
    getCurrentLocation();
  };

  const setupEventListeners = () => {
    riderTrackingService.on("connected", handleConnected);
    riderTrackingService.on("disconnected", handleDisconnected);
    riderTrackingService.on("location-update", handleLocationUpdate);
    riderTrackingService.on("delivery-started", handleDeliveryStarted);
    riderTrackingService.on("delivery-completed", handleDeliveryCompleted);
    riderTrackingService.on(
      "server-location-updated",
      handleServerLocationUpdated
    );
    riderTrackingService.on("route-update", handleRouteUpdate);
    riderTrackingService.on("location-error", handleLocationError);
    riderTrackingService.on("connection-error", handleConnectionError);
  };

  const getCurrentLocation = async () => {
    try {
      const location = await riderTrackingService.getCurrentLocation();
      setCurrentLocation(location);
      setMapCenter({ lat: location.latitude, lng: location.longitude });
      setGpsAccuracy(location.accuracy);
      console.log("📍 Current location obtained:", location);
    } catch (error) {
      console.error("Error getting current location:", error);
      setError("Failed to get GPS location. Please enable location services.");
    }
  };

  // Event Handlers
  const handleConnected = (data) => {
    console.log("🔗 Rider tracking connected:", data);
    setConnectionStatus("connected");
    setError(null);
  };

  const handleDisconnected = (data) => {
    console.log("❌ Rider tracking disconnected:", data);
    setConnectionStatus("disconnected");
    setIsTracking(false);
  };

  const handleLocationUpdate = (locationData) => {
    console.log("📍 Location update:", locationData);
    setCurrentLocation({
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      heading: locationData.heading,
      speed: locationData.speed,
      accuracy: locationData.accuracy,
    });
    setLastLocationUpdate(new Date());
    setGpsAccuracy(locationData.accuracy);
  };

  const handleDeliveryStarted = (data) => {
    console.log("🚀 Delivery started:", data);
    setDeliveryStatus("picked_up");
    setIsTracking(true);
    if (onStatusUpdate) {
      onStatusUpdate(delivery.$id, "picked_up");
    }
  };

  const handleDeliveryCompleted = (data) => {
    console.log("✅ Delivery completed:", data);
    setDeliveryStatus("delivered");
    setIsTracking(false);
    if (onStatusUpdate) {
      onStatusUpdate(delivery.$id, "delivered");
    }
  };

  const handleServerLocationUpdated = (data) => {
    console.log("📡 Server location updated:", data);
  };

  const handleRouteUpdate = (routeData) => {
    console.log("🗺️ Route update:", routeData);
    setRouteInfo(routeData);
  };

  const handleLocationError = (error) => {
    console.error("📍 Location error:", error);
    setError(`GPS Error: ${error.error}`);
  };

  const handleConnectionError = (error) => {
    console.error("🔗 Connection error:", error);
    setError(`Connection Error: ${error.error}`);
  };

  // Action Handlers
  const handleStartDelivery = async () => {
    if (!currentLocation) {
      setError("Current location not available. Please wait for GPS.");
      return;
    }

    try {
      setError(null);
      const result = await riderTrackingService.startDelivery(
        delivery.$id,
        currentLocation
      );

      if (result.success) {
        console.log("✅ Delivery started successfully");
      } else {
        setError(result.error || "Failed to start delivery");
      }
    } catch (error) {
      console.error("Error starting delivery:", error);
      setError("Failed to start delivery");
    }
  };

  const handleCompleteDelivery = async () => {
    if (!currentLocation) {
      setError("Current location not available. Please wait for GPS.");
      return;
    }

    const notes = prompt("Add any delivery notes (optional):");

    try {
      setError(null);
      const result = await riderTrackingService.completeDelivery(
        delivery.$id,
        currentLocation,
        notes || ""
      );

      if (result.success) {
        console.log("✅ Delivery completed successfully");
      } else {
        setError(result.error || "Failed to complete delivery");
      }
    } catch (error) {
      console.error("Error completing delivery:", error);
      setError("Failed to complete delivery");
    }
  };

  const handleRequestRoute = () => {
    if (currentLocation && delivery.deliveryAddress) {
      riderTrackingService.requestRoute(
        { lat: currentLocation.latitude, lng: currentLocation.longitude },
        delivery.deliveryAddress
      );
    }
  };

  const getStatusColor = () => {
    switch (deliveryStatus) {
      case "assigned":
        return "bg-blue-500";
      case "picked_up":
        return "bg-yellow-500";
      case "in_transit":
        return "bg-purple-500";
      case "delivered":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = () => {
    switch (deliveryStatus) {
      case "assigned":
        return "Ready to Start";
      case "picked_up":
        return "Order Picked Up";
      case "in_transit":
        return "In Transit";
      case "delivered":
        return "Delivered";
      default:
        return "Unknown";
    }
  };

  const getConnectionIndicator = () => {
    if (isTracking) {
      return (
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-green-400 text-sm font-medium">
            Live Tracking
          </span>
        </div>
      );
    }

    switch (connectionStatus) {
      case "connected":
        return (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-blue-400 text-sm font-medium">Connected</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className="text-gray-400 text-sm font-medium">Offline</span>
          </div>
        );
    }
  };

  const renderActionButtons = () => {
    switch (deliveryStatus) {
      case "assigned":
        return (
          <button
            onClick={handleStartDelivery}
            disabled={!currentLocation}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center space-x-2"
          >
            <Play className="w-5 h-5" />
            <span>{currentLocation ? "Start Delivery" : "Getting GPS..."}</span>
          </button>
        );

      case "picked_up":
      case "in_transit":
        return (
          <div className="space-y-3">
            <button
              onClick={handleRequestRoute}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center space-x-2"
            >
              <Route className="w-5 h-5" />
              <span>Get Navigation</span>
            </button>
            <button
              onClick={handleCompleteDelivery}
              disabled={!currentLocation}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center space-x-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Mark as Delivered</span>
            </button>
          </div>
        );

      case "delivered":
        return (
          <div className="w-full py-3 bg-green-600/20 text-green-400 font-medium rounded-xl flex items-center justify-center space-x-2 border border-green-500/30">
            <CheckCircle className="w-5 h-5" />
            <span>Delivery Completed</span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
            <Navigation className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Delivery #{delivery.orderId?.slice(-8)}
            </h3>
            <p className="text-gray-400 text-sm">Live Navigation & Tracking</p>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2">
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()} text-white`}
          >
            {getStatusText()}
          </div>
          {getConnectionIndicator()}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 text-sm font-medium">Error</p>
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* Location Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Current Location */}
        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-400" />
            </div>
            <h4 className="text-white font-medium">Your Location</h4>
          </div>
          {currentLocation ? (
            <div className="space-y-1">
              <p className="text-gray-300 text-sm">
                📍 {currentLocation.latitude.toFixed(6)},{" "}
                {currentLocation.longitude.toFixed(6)}
              </p>
              {gpsAccuracy && (
                <p className="text-gray-500 text-xs">
                  Accuracy: ±{Math.round(gpsAccuracy)}m
                </p>
              )}
              {lastLocationUpdate && (
                <p className="text-gray-500 text-xs">
                  Updated: {lastLocationUpdate.toLocaleTimeString()}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Getting location...</p>
          )}
        </div>

        {/* Delivery Address */}
        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-green-400" />
            </div>
            <h4 className="text-white font-medium">Delivery Address</h4>
          </div>
          <p className="text-gray-300 text-sm">{delivery.deliveryAddress}</p>
          <p className="text-gray-500 text-xs mt-1">
            Customer: {delivery.customerName}
          </p>
        </div>
      </div>

      {/* Map Visualization */}
      <div className="mb-6">
        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium">Route Map</h4>
            <button
              onClick={() => setShowMap(!showMap)}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              {showMap ? "Hide Map" : "Show Map"}
            </button>
          </div>

          {showMap ? (
            <div className="h-48 bg-gradient-to-br from-gray-900 to-black border border-gray-700/50 rounded-lg overflow-hidden relative">
              {/* Simple map visualization */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-green-900/20"></div>

              {/* Route line */}
              <div className="absolute left-1/4 top-1/2 w-1/2 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500"></div>

              {/* Your location */}
              <div className="absolute left-1/4 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-lg border-2 border-white">
                  <Truck className="w-4 h-4 text-white" />
                  {isTracking && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 animate-ping"></div>
                  )}
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <span className="text-xs text-blue-300 bg-blue-900/50 px-2 py-1 rounded">
                    You are here
                  </span>
                </div>
              </div>

              {/* Destination */}
              <div className="absolute right-1/4 top-1/2 transform translate-x-1/2 -translate-y-1/2">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center shadow-lg border-2 border-white">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <span className="text-xs text-green-300 bg-green-900/50 px-2 py-1 rounded">
                    Destination
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-24 bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700/50 rounded-lg flex items-center justify-center">
              <p className="text-gray-400 text-sm">
                Click "Show Map" to view route
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-400">
            {currentLocation?.speed
              ? Math.round(currentLocation.speed * 3.6)
              : "0"}
          </p>
          <p className="text-xs text-gray-500">km/h</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-400">
            {routeInfo?.distance || "--"}
          </p>
          <p className="text-xs text-gray-500">Distance</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-400">
            KES {delivery.riderEarning?.toFixed(2) || "0.00"}
          </p>
          <p className="text-xs text-gray-500">Earning</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        {renderActionButtons()}

        {/* Customer Contact */}
        {delivery.customerPhone && (
          <a
            href={`tel:${delivery.customerPhone}`}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center space-x-2 border border-gray-600"
          >
            <span>📞 Call Customer</span>
          </a>
        )}
      </div>

      {/* Tracking Status */}
      {isTracking && (
        <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg text-center">
          <div className="flex items-center justify-center space-x-2 text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium">
              Live tracking active - Customers can see your location
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderDeliveryMap;
