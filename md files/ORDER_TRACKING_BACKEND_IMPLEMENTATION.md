# Order Tracking Backend Implementation

This backend controller provides API endpoints to handle order status tracking, replacing direct database calls from the frontend.

## 🚀 API Endpoints

### 1. Get Single Order Status

```
GET /api/orders/tracking/:orderId
Authorization: Bearer <token>
```

**Description:** Fetches detailed order status and tracking information for a specific order.

**Response:**

```json
{
  "success": true,
  "data": {
    "orderId": "order123",
    "orderStatus": "processing",
    "paymentStatus": "completed",
    "paymentMethod": "stripe",
    "amount": 129.99,
    "subtotal": 119.99,
    "shippingFee": 10.0,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T11:30:00.000Z",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "+1234567890",
    "shippingAddress": "123 Main St, City, State 12345",
    "items": [
      {
        "productId": "prod123",
        "name": "Product Name",
        "quantity": 2,
        "price": 59.99
      }
    ],
    "trackingNumber": "TRK123456789",
    "estimatedDelivery": "2024-01-17T18:00:00.000Z",
    "riderId": "rider123",
    "riderDetails": {
      "name": "Mike Johnson",
      "phone": "+1987654321",
      "rating": 4.8,
      "status": "active"
    },
    "isPremiumOrder": true,
    "premiumDiscountAmount": 15.0,
    "deliverySavings": 5.0,
    "milesBonus": 150
  }
}
```

### 2. Get User Orders List

```
GET /api/orders/tracking
Authorization: Bearer <token>

Query Parameters:
- status: Filter by order status (optional)
- limit: Number of orders to return (default: 10)
- offset: Number of orders to skip (default: 0)
```

**Response:**

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "orderId": "order123",
        "orderStatus": "processing",
        "paymentStatus": "completed",
        "amount": 129.99,
        "createdAt": "2024-01-15T10:00:00.000Z",
        "itemsCount": 3,
        "isPremiumOrder": true,
        "trackingNumber": "TRK123456789"
      }
    ],
    "total": 25,
    "hasMore": true
  }
}
```

### 3. Update Order Location (Testing/Simulation)

```
PATCH /api/orders/tracking/:orderId/location
Authorization: Bearer <token>

Body:
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "status": "out_for_delivery"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Location updated successfully",
  "data": {
    "orderId": "order123",
    "orderStatus": "out_for_delivery",
    "currentLatitude": 40.7128,
    "currentLongitude": -74.006,
    "updatedAt": "2024-01-15T14:30:00.000Z"
  }
}
```

## 🔧 Frontend Integration

### Replace Your Current useEffect

**Before (Direct Database Call):**

```javascript
useEffect(() => {
  if (!orderId) return;

  const fetchInitialStatus = async () => {
    try {
      const response = await databases.getDocument(
        Config.databaseId,
        Config.orderCollectionId,
        orderId
      );
      console.log("Initial Order Status:", response);
      setOrderStatus(response.orderStatus || "Pending");
      if (response && response.orderStatus) {
        setOrderStatus(response.orderStatus);
        updateStep(response.orderStatus);
      }
    } catch (error) {
      console.error("Error fetching initial order status:", error);
    }
  };

  fetchInitialStatus();
  // ... rest of the code
}, [orderId]);
```

**After (Backend API Call):**

```javascript
useEffect(() => {
  if (!orderId) return;

  const fetchInitialStatus = async () => {
    try {
      const token = localStorage.getItem("authToken"); // or however you store your auth token

      const response = await fetch(`/api/orders/tracking/${orderId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log("Initial Order Status:", data.data);
        setOrderStatus(data.data.orderStatus || "Pending");
        updateStep(data.data.orderStatus);

        // You can also set additional data:
        setTrackingNumber(data.data.trackingNumber);
        setEstimatedDelivery(data.data.estimatedDelivery);
        setRiderInfo(data.data.riderDetails);
      } else {
        throw new Error(data.message || "Failed to fetch order status");
      }
    } catch (error) {
      console.error("Error fetching initial order status:", error);
      // Handle error appropriately
    }
  };

  fetchInitialStatus();

  // For real-time updates, you can still use Appwrite subscriptions
  // or implement WebSocket/Server-Sent Events through your backend
  const unsubscribe = client.subscribe(
    `databases.${Config.orderCollectionId}.orders.documents.${orderId}`,
    (response) => {
      if (response.payload?.orderStatus) {
        console.log("Live Update:", response.payload.orderStatus);
        setOrderStatus(response.payload.orderStatus);
        updateStep(response.payload.orderStatus);
        updateLiveLocation(response.payload.orderStatus);
      }
    }
  );

  return () => {
    unsubscribe();
  };
}, [orderId]);
```

### Alternative: Using Axios

```javascript
import axios from "axios";

// Set up axios defaults
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3000",
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// In your component
useEffect(() => {
  if (!orderId) return;

  const fetchInitialStatus = async () => {
    try {
      const response = await api.get(`/api/orders/tracking/${orderId}`);

      if (response.data.success) {
        const orderData = response.data.data;
        console.log("Initial Order Status:", orderData);
        setOrderStatus(orderData.orderStatus || "Pending");
        updateStep(orderData.orderStatus);
      }
    } catch (error) {
      console.error(
        "Error fetching initial order status:",
        error.response?.data || error.message
      );
    }
  };

  fetchInitialStatus();
  // ... rest of subscription code remains the same
}, [orderId]);
```

## 🔄 Real-time Updates

The backend controller integrates with your existing Appwrite real-time subscriptions. You can keep using the subscription code for live updates, but now the initial data fetch comes from your secure backend API.

### Enhanced Real-time Integration

If you want to move real-time updates to the backend as well, you could:

1. **WebSocket Implementation:** Set up WebSocket connections through your backend
2. **Server-Sent Events:** Use SSE for one-way real-time updates
3. **Polling:** Simple HTTP polling at regular intervals

Example polling approach:

```javascript
const startPolling = () => {
  const pollInterval = setInterval(async () => {
    try {
      const response = await api.get(`/api/orders/tracking/${orderId}`);
      if (response.data.success) {
        const newStatus = response.data.data.orderStatus;
        if (newStatus !== orderStatus) {
          setOrderStatus(newStatus);
          updateStep(newStatus);
        }
      }
    } catch (error) {
      console.error("Polling error:", error);
    }
  }, 30000); // Poll every 30 seconds

  return () => clearInterval(pollInterval);
};
```

## 🔒 Security Features

- **Authentication Required:** All endpoints require valid JWT token
- **User Authorization:** Orders are filtered by user ID (optional validation included)
- **Error Handling:** Comprehensive error responses
- **Input Validation:** Order ID validation and sanitization

## 🚀 Getting Started

1. The routes are already registered in your main app
2. Update your frontend code to use the new API endpoints
3. Ensure your auth tokens are properly included in requests
4. Test the endpoints using the provided examples

## 🧪 Testing

You can test the endpoints using curl:

```bash
# Get order status
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/orders/tracking/ORDER_ID

# Get user orders
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/orders/tracking

# Update location (for testing)
curl -X PATCH \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"latitude": 40.7128, "longitude": -74.0060, "status": "out_for_delivery"}' \
     http://localhost:3000/api/orders/tracking/ORDER_ID/location
```

## 📝 Error Responses

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development)"
}
```

Common HTTP status codes:

- `200`: Success
- `400`: Bad Request (missing/invalid parameters)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (access denied)
- `404`: Not Found (order doesn't exist)
- `500`: Internal Server Error
