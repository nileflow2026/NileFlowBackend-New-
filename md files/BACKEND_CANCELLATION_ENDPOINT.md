# Order Cancellation Backend Endpoint

## Required Backend Endpoint

Create this endpoint in your backend to handle cancellation requests:

### Endpoint: `POST /api/orders/cancel-request`

**Purpose:** Receives and processes order cancellation requests from customers.

**Request Body:**

```javascript
{
  orderId: string,           // The order ID to cancel
  reason: string,            // Cancellation reason (e.g., "Changed my mind")
  additionalDetails: string, // Optional additional information
  userId: string,            // User ID making the request
  customerEmail: string,     // Customer email
  customerName: string       // Customer name
}
```

**Success Response (200):**

```javascript
{
  success: true,
  message: "Cancellation request submitted successfully",
  requestId: string          // ID of the cancellation request (optional)
}
```

**Error Responses:**

- **400 Bad Request:**

```javascript
{
  success: false,
  message: "Order ID is required"
}
```

- **404 Not Found:**

```javascript
{
  success: false,
  message: "Order not found"
}
```

- **400 Order Not Eligible:**

```javascript
{
  success: false,
  message: "This order cannot be cancelled (already shipped/delivered)"
}
```

## Suggested Implementation Logic

```javascript
const handleCancelRequest = async (req, res) => {
  try {
    const {
      orderId,
      reason,
      additionalDetails,
      userId,
      customerEmail,
      customerName,
    } = req.body;

    // Validate input
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    // Get order from database
    const order = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      orderId
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order belongs to user
    if (order.users !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to cancel this order",
      });
    }

    // Check if order is eligible for cancellation
    const eligibleStatuses = ["pending", "processing", "ordered"];
    const currentStatus =
      order.orderStatus?.toLowerCase() || order.status?.toLowerCase();

    if (!eligibleStatuses.includes(currentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${currentStatus}. Order must be in pending or processing status.`,
      });
    }

    // Check if order is too old (more than 24 hours)
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    const hoursSinceOrder = (now - orderDate) / (1000 * 60 * 60);

    if (hoursSinceOrder > 24) {
      // Still allow request but flag for manual review
      console.warn(
        `Order ${orderId} is older than 24 hours, flagging for review`
      );
    }

    // Create cancellation request document
    const requestId = ID.unique();
    await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CANCELLATION_REQUESTS_COLLECTION, // Create this collection
      requestId,
      {
        orderId,
        userId,
        customerEmail,
        customerName,
        reason,
        additionalDetails: additionalDetails || "",
        status: "pending", // pending, approved, rejected
        requestedAt: new Date().toISOString(),
        orderAmount: order.amount,
        orderStatus: currentStatus,
        paymentMethod: order.paymentMethod,
      }
    );

    // Send notification to customer
    await createNotification({
      userId,
      message: `Your cancellation request for order ${orderId} has been received. We'll review it within 24 hours.`,
      type: "order",
      username: customerName,
      email: customerEmail,
    });

    // Send email to customer
    await sendCancellationRequestEmail({
      customerEmail,
      customerName,
      orderId,
      reason,
    });

    // Notify admin team (optional)
    // await notifyAdminTeam('New cancellation request', { orderId, reason });

    return res.status(200).json({
      success: true,
      message: "Cancellation request submitted successfully",
      requestId,
    });
  } catch (error) {
    console.error("❌ Cancel request error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit cancellation request",
      error: error.message,
    });
  }
};
```

## Appwrite Database Setup

Create a new collection for cancellation requests:

**Collection Name:** `cancellationRequests`

**Attributes:**

- `orderId` (string, required)
- `userId` (string, required)
- `customerEmail` (string, required)
- `customerName` (string, required)
- `reason` (string, required)
- `additionalDetails` (string, optional)
- `status` (string, required) - values: "pending", "approved", "rejected"
- `requestedAt` (datetime, required)
- `reviewedAt` (datetime, optional)
- `reviewedBy` (string, optional)
- `orderAmount` (float, required)
- `orderStatus` (string, required)
- `paymentMethod` (string, required)
- `adminNotes` (string, optional)

## Admin Dashboard Feature (Optional)

You can create an admin dashboard page to review and approve/reject cancellation requests:

- List all cancellation requests
- Filter by status (pending/approved/rejected)
- View order details
- Approve or reject with notes
- Process refunds for approved requests
- Send email notifications to customers

## Email Template

```javascript
async function sendCancellationRequestEmail({
  customerEmail,
  customerName,
  orderId,
  reason,
}) {
  const emailContent = `
    <h2>Cancellation Request Received</h2>
    <p>Dear ${customerName},</p>
    <p>We have received your request to cancel order <strong>#${orderId}</strong>.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>Our team will review your request and respond within 24 hours.</p>
    <p>If approved, any payments made will be refunded to your original payment method within 5-7 business days.</p>
    <p>Thank you for your patience.</p>
    <br>
    <p>Best regards,<br>Nile Flow Team</p>
  `;

  // Send email using your email service
  // await sendEmail(customerEmail, 'Order Cancellation Request Received', emailContent);
}
```

## Routes Setup

Add this route to your backend routes file:

```javascript
router.post("/orders/cancel-request", authenticateToken, handleCancelRequest);
```

## Testing

Test the endpoint with:

```bash
curl -X POST http://localhost:3000/api/orders/cancel-request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "orderId": "test123",
    "reason": "Changed my mind",
    "additionalDetails": "Found a better price elsewhere",
    "userId": "user123",
    "customerEmail": "customer@example.com",
    "customerName": "John Doe"
  }'
```

Expected response:

```json
{
  "success": true,
  "message": "Cancellation request submitted successfully",
  "requestId": "req_abc123"
}
```
