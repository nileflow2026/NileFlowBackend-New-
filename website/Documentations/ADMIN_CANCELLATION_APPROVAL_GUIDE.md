# Admin Cancellation Approval System - Implementation Guide

## Overview

This guide explains how to implement an admin dashboard feature to review, approve, or reject customer order cancellation requests.

---

## 1. Database Schema Updates

### Existing Collection: `cancellationRequests`

Add these additional attributes if not present:

```javascript
{
  // Existing fields
  orderId: string,
  userId: string,
  customerEmail: string,
  customerName: string,
  reason: string,
  additionalDetails: string,
  status: string, // "pending", "approved", "rejected"
  requestedAt: datetime,
  orderAmount: float,
  orderStatus: string,
  paymentMethod: string,

  // Add these new fields
  reviewedAt: datetime (optional),
  reviewedBy: string (optional), // Admin user ID or name
  adminNotes: string (optional),
  refundStatus: string (optional), // "pending", "processing", "completed", "failed"
  refundProcessedAt: datetime (optional),
  refundAmount: float (optional),
  autoApproved: boolean (optional), // For tracking auto vs manual approval
}
```

---

## 2. Backend Endpoints

### A. Get All Cancellation Requests (Admin Only)

**Endpoint:** `GET /api/admin/cancellation-requests`

**Query Parameters:**

- `status` (optional): "pending" | "approved" | "rejected" | "all"
- `page` (optional): Page number for pagination
- `limit` (optional): Items per page

**Implementation:**

```javascript
const getCancellationRequests = async (req, res) => {
  try {
    // Verify admin authentication
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { status = "all", page = 1, limit = 20 } = req.query;

    // Build query
    const queries = [];
    if (status !== "all") {
      queries.push(Query.equal("status", status));
    }

    queries.push(Query.orderDesc("requestedAt"));
    queries.push(Query.limit(parseInt(limit)));
    queries.push(Query.offset((parseInt(page) - 1) * parseInt(limit)));

    const requests = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CANCELLATION_REQUESTS_COLLECTION,
      queries
    );

    // Get order details for each request
    const enrichedRequests = await Promise.all(
      requests.documents.map(async (request) => {
        try {
          const order = await db.getDocument(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_ORDERS_COLLECTION,
            request.orderId
          );
          return {
            ...request,
            orderDetails: order,
          };
        } catch (error) {
          return {
            ...request,
            orderDetails: null,
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      requests: enrichedRequests,
      total: requests.total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("❌ Get cancellation requests error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cancellation requests",
      error: error.message,
    });
  }
};
```

---

### B. Approve Cancellation Request

**Endpoint:** `POST /api/admin/cancellation-requests/:requestId/approve`

**Request Body:**

```javascript
{
  adminNotes: string (optional),
  adminId: string,
  adminName: string
}
```

**Implementation:**

```javascript
const approveCancellationRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminNotes, adminId, adminName } = req.body;

    // Verify admin authentication
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    // Get cancellation request
    const request = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CANCELLATION_REQUESTS_COLLECTION,
      requestId
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Cancellation request not found",
      });
    }

    // Check if already processed
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request already ${request.status}`,
      });
    }

    // Get order details
    const order = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      request.orderId
    );

    // Update cancellation request
    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CANCELLATION_REQUESTS_COLLECTION,
      requestId,
      {
        status: "approved",
        reviewedAt: new Date().toISOString(),
        reviewedBy: adminName || adminId,
        adminNotes: adminNotes || "Approved by admin",
        refundStatus:
          order.paymentMethod === "Cash on Delivery"
            ? "not_applicable"
            : "pending",
        refundAmount: parseFloat(order.amount),
      }
    );

    // Update order status
    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ORDERS_COLLECTION,
      request.orderId,
      {
        orderStatus: "Cancelled",
        status: "Cancelled",
        paymentStatus: "cancelled",
        cancelledAt: new Date().toISOString(),
        cancelledBy: "admin",
        cancellationReason: request.reason,
        updatedAt: new Date().toISOString(),
      }
    );

    // Restore stock if it was reduced
    if (order.stockUpdated) {
      try {
        const cart = JSON.parse(order.items || "[]");
        await restoreProductStock(cart, order.$id);
        console.log("✅ Stock restored for cancelled order");
      } catch (e) {
        console.warn("⚠️ Stock restore error:", e.message);
      }
    }

    // Process refund if payment was made
    if (order.paymentMethod !== "Cash on Delivery") {
      try {
        // Update refund status to processing
        await db.updateDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_CANCELLATION_REQUESTS_COLLECTION,
          requestId,
          { refundStatus: "processing" }
        );

        // Process refund based on payment method
        if (
          order.paymentMethod === "M-Pesa" ||
          order.paymentMethod.includes("M-Pesa")
        ) {
          // Initiate M-Pesa refund
          // await processMpesaRefund(order);
          console.log("📱 M-Pesa refund initiated");
        } else if (
          order.paymentMethod === "Credit/Debit Card" ||
          order.paymentMethod.includes("Stripe")
        ) {
          // Initiate Stripe refund
          // await processStripeRefund(order.stripePaymentIntentId);
          console.log("💳 Stripe refund initiated");
        }

        // Update refund status
        await db.updateDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_CANCELLATION_REQUESTS_COLLECTION,
          requestId,
          {
            refundStatus: "completed",
            refundProcessedAt: new Date().toISOString(),
          }
        );
      } catch (refundError) {
        console.error("❌ Refund processing error:", refundError);
        await db.updateDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_CANCELLATION_REQUESTS_COLLECTION,
          requestId,
          { refundStatus: "failed" }
        );
      }
    }

    // Send notification to customer
    await createNotification({
      userId: request.userId,
      message: `Your cancellation request for order ${
        request.orderId
      } has been approved. ${
        order.paymentMethod !== "Cash on Delivery"
          ? "Refund will be processed within 5-7 business days."
          : ""
      }`,
      type: "order",
      username: request.customerName,
      email: request.customerEmail,
    });

    // Send approval email
    await sendCancellationApprovalEmail({
      customerEmail: request.customerEmail,
      customerName: request.customerName,
      orderId: request.orderId,
      orderAmount: order.amount,
      paymentMethod: order.paymentMethod,
      refundTimeline:
        order.paymentMethod !== "Cash on Delivery"
          ? "5-7 business days"
          : "N/A",
      adminNotes: adminNotes,
    });

    console.log("✅ Cancellation approved and processed");

    return res.status(200).json({
      success: true,
      message: "Cancellation request approved successfully",
      requestId,
      orderId: request.orderId,
      refundStatus:
        order.paymentMethod === "Cash on Delivery"
          ? "not_applicable"
          : "processing",
    });
  } catch (error) {
    console.error("❌ Approve cancellation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve cancellation request",
      error: error.message,
    });
  }
};
```

---

### C. Reject Cancellation Request

**Endpoint:** `POST /api/admin/cancellation-requests/:requestId/reject`

**Request Body:**

```javascript
{
  adminNotes: string (required),
  adminId: string,
  adminName: string
}
```

**Implementation:**

```javascript
const rejectCancellationRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminNotes, adminId, adminName } = req.body;

    // Verify admin authentication
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    if (!adminNotes) {
      return res.status(400).json({
        success: false,
        message: "Admin notes are required for rejection",
      });
    }

    // Get cancellation request
    const request = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CANCELLATION_REQUESTS_COLLECTION,
      requestId
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Cancellation request not found",
      });
    }

    // Check if already processed
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request already ${request.status}`,
      });
    }

    // Update cancellation request
    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CANCELLATION_REQUESTS_COLLECTION,
      requestId,
      {
        status: "rejected",
        reviewedAt: new Date().toISOString(),
        reviewedBy: adminName || adminId,
        adminNotes: adminNotes,
      }
    );

    // Send notification to customer
    await createNotification({
      userId: request.userId,
      message: `Your cancellation request for order ${request.orderId} could not be approved. Reason: ${adminNotes}`,
      type: "order",
      username: request.customerName,
      email: request.customerEmail,
    });

    // Send rejection email
    await sendCancellationRejectionEmail({
      customerEmail: request.customerEmail,
      customerName: request.customerName,
      orderId: request.orderId,
      reason: adminNotes,
    });

    console.log("✅ Cancellation rejected");

    return res.status(200).json({
      success: true,
      message: "Cancellation request rejected",
      requestId,
    });
  } catch (error) {
    console.error("❌ Reject cancellation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject cancellation request",
      error: error.message,
    });
  }
};
```

---

## 3. Routes Setup

Add these routes to your admin routes file:

```javascript
// Admin routes (require admin authentication middleware)
router.get(
  "/admin/cancellation-requests",
  authenticateAdmin,
  getCancellationRequests
);
router.post(
  "/admin/cancellation-requests/:requestId/approve",
  authenticateAdmin,
  approveCancellationRequest
);
router.post(
  "/admin/cancellation-requests/:requestId/reject",
  authenticateAdmin,
  rejectCancellationRequest
);
```

---

## 4. Email Templates

### Approval Email Template

```javascript
async function sendCancellationApprovalEmail({
  customerEmail,
  customerName,
  orderId,
  orderAmount,
  paymentMethod,
  refundTimeline,
  adminNotes,
}) {
  const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; }
        .info-box { background: white; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Cancellation Approved</h1>
        </div>
        <div class="content">
          <p>Dear ${customerName},</p>
          
          <p>Your cancellation request has been <strong>approved</strong>.</p>
          
          <div class="info-box">
            <p><strong>Order ID:</strong> #${orderId}</p>
            <p><strong>Order Amount:</strong> ${orderAmount} KES</p>
            <p><strong>Payment Method:</strong> ${paymentMethod}</p>
          </div>

          ${
            paymentMethod !== "Cash on Delivery"
              ? `
            <div class="info-box">
              <h3>💰 Refund Information</h3>
              <p><strong>Refund Amount:</strong> ${orderAmount} KES</p>
              <p><strong>Refund Timeline:</strong> ${refundTimeline}</p>
              <p><strong>Refund Method:</strong> Original payment method</p>
            </div>
          `
              : `
            <div class="info-box">
              <p>✅ No payment was made for this order (Cash on Delivery)</p>
            </div>
          `
          }

          ${
            adminNotes
              ? `
            <div class="info-box">
              <p><strong>Admin Notes:</strong> ${adminNotes}</p>
            </div>
          `
              : ""
          }

          <p>Your order has been successfully cancelled. ${
            paymentMethod !== "Cash on Delivery"
              ? "The refund will be processed and credited to your original payment method within the specified timeline."
              : ""
          }</p>

          <p>If you have any questions, please don't hesitate to contact our support team.</p>

          <center>
            <a href="${
              process.env.FRONTEND_URL || "http://localhost:5173"
            }/orders" class="button">View My Orders</a>
          </center>
        </div>
        <div class="footer">
          <p>Thank you for shopping with Nile Flow</p>
          <p>© 2025 Nile Flow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send email using your email service
  await sendEmail({
    to: customerEmail,
    subject: "Order Cancellation Approved - Nile Flow",
    html: emailContent,
  });
}
```

### Rejection Email Template

```javascript
async function sendCancellationRejectionEmail({
  customerEmail,
  customerName,
  orderId,
  reason,
}) {
  const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; }
        .info-box { background: white; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Cancellation Request Update</h1>
        </div>
        <div class="content">
          <p>Dear ${customerName},</p>
          
          <p>We have reviewed your cancellation request for order <strong>#${orderId}</strong>.</p>
          
          <p>Unfortunately, we are unable to approve your cancellation request at this time.</p>
          
          <div class="info-box">
            <h3>Reason:</h3>
            <p>${reason}</p>
          </div>

          <p><strong>What happens next?</strong></p>
          <ul>
            <li>Your order will continue to be processed as normal</li>
            <li>You can track your order status in your account</li>
            <li>Once delivered, you may use our return policy if needed</li>
          </ul>

          <p>If you have questions or concerns about this decision, please contact our support team.</p>

          <center>
            <a href="${
              process.env.FRONTEND_URL || "http://localhost:5173"
            }/contact" class="button">Contact Support</a>
          </center>
        </div>
        <div class="footer">
          <p>Thank you for shopping with Nile Flow</p>
          <p>© 2025 Nile Flow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send email using your email service
  await sendEmail({
    to: customerEmail,
    subject: "Order Cancellation Request Update - Nile Flow",
    html: emailContent,
  });
}
```

---

## 5. Frontend Admin Dashboard Component

### Component: `AdminCancellationRequests.jsx`

```javascript
import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Package,
  User,
  Calendar,
  DollarSign,
} from "lucide-react";

const AdminCancellationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/cancellation-requests?status=${statusFilter}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (
      !window.confirm("Are you sure you want to approve this cancellation?")
    ) {
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(
        `/api/admin/cancellation-requests/${requestId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({
            adminNotes,
            adminId: "current-admin-id", // Get from auth context
            adminName: "Admin Name", // Get from auth context
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("Cancellation approved successfully!");
        setSelectedRequest(null);
        setAdminNotes("");
        fetchRequests();
      } else {
        alert(data.message || "Failed to approve cancellation");
      }
    } catch (error) {
      console.error("Error approving:", error);
      alert("An error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (requestId) => {
    if (!adminNotes.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    if (!window.confirm("Are you sure you want to reject this cancellation?")) {
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(
        `/api/admin/cancellation-requests/${requestId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({
            adminNotes,
            adminId: "current-admin-id", // Get from auth context
            adminName: "Admin Name", // Get from auth context
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("Cancellation rejected");
        setSelectedRequest(null);
        setAdminNotes("");
        fetchRequests();
      } else {
        alert(data.message || "Failed to reject cancellation");
      }
    } catch (error) {
      console.error("Error rejecting:", error);
      alert("An error occurred");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Cancellation Requests</h1>

      {/* Status Filter */}
      <div className="flex space-x-4 mb-6">
        {["pending", "approved", "rejected", "all"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-semibold ${
              statusFilter === status
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <div
              key={request.$id}
              className="bg-white border rounded-lg p-6 shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">
                    Order #{request.orderId}
                  </h3>
                  <p className="text-gray-600">
                    <User className="inline w-4 h-4" /> {request.customerName} (
                    {request.customerEmail})
                  </p>
                  <p className="text-gray-600">
                    <Calendar className="inline w-4 h-4" />{" "}
                    {new Date(request.requestedAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    request.status === "pending"
                      ? "bg-yellow-200 text-yellow-800"
                      : request.status === "approved"
                      ? "bg-green-200 text-green-800"
                      : "bg-red-200 text-red-800"
                  }`}
                >
                  {request.status}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="font-semibold">Reason:</p>
                  <p>{request.reason}</p>
                </div>
                <div>
                  <p className="font-semibold">Order Amount:</p>
                  <p>
                    <DollarSign className="inline w-4 h-4" />{" "}
                    {request.orderAmount} KES
                  </p>
                </div>
              </div>

              {request.additionalDetails && (
                <div className="mb-4">
                  <p className="font-semibold">Additional Details:</p>
                  <p className="text-gray-600">{request.additionalDetails}</p>
                </div>
              )}

              {request.status === "pending" && (
                <div className="space-y-4">
                  <textarea
                    placeholder="Admin notes (optional for approval, required for rejection)"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                    rows="3"
                  />
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleApprove(request.$id)}
                      disabled={processing}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="inline w-5 h-5 mr-2" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(request.$id)}
                      disabled={processing}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle className="inline w-5 h-5 mr-2" />
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {request.status !== "pending" && request.reviewedBy && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <p className="font-semibold">
                    Reviewed by: {request.reviewedBy}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(request.reviewedAt).toLocaleString()}
                  </p>
                  {request.adminNotes && (
                    <p className="mt-2 text-gray-700">
                      Notes: {request.adminNotes}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCancellationRequests;
```

---

## 6. Testing Guide

### Test Approval Flow

```bash
# 1. Get pending requests
curl -X GET http://localhost:3000/api/admin/cancellation-requests?status=pending \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 2. Approve a request
curl -X POST http://localhost:3000/api/admin/cancellation-requests/REQUEST_ID/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "adminNotes": "Approved as per policy",
    "adminId": "admin123",
    "adminName": "John Admin"
  }'
```

### Test Rejection Flow

```bash
curl -X POST http://localhost:3000/api/admin/cancellation-requests/REQUEST_ID/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "adminNotes": "Order already shipped, cannot cancel",
    "adminId": "admin123",
    "adminName": "John Admin"
  }'
```

---

## 7. Implementation Checklist

- [ ] Add new database fields to `cancellationRequests` collection
- [ ] Create admin authentication middleware
- [ ] Implement `getCancellationRequests` endpoint
- [ ] Implement `approveCancellationRequest` endpoint
- [ ] Implement `rejectCancellationRequest` endpoint
- [ ] Create email templates for approval and rejection
- [ ] Set up refund processing logic for different payment methods
- [ ] Create admin dashboard component
- [ ] Add routes to admin router
- [ ] Test approval flow
- [ ] Test rejection flow
- [ ] Test email notifications
- [ ] Test refund processing
- [ ] Deploy and monitor

---

## 8. Auto-Approval Rules (Optional)

You can implement auto-approval for certain cases:

```javascript
const shouldAutoApprove = (request, order) => {
  // Auto-approve if:
  // 1. Order is COD and still pending
  if (
    order.paymentMethod === "Cash on Delivery" &&
    order.orderStatus?.toLowerCase() === "pending"
  ) {
    return true;
  }

  // 2. Order requested within 1 hour of placement
  const orderDate = new Date(order.createdAt);
  const now = new Date();
  const hoursSinceOrder = (now - orderDate) / (1000 * 60 * 60);

  if (hoursSinceOrder < 1 && order.orderStatus?.toLowerCase() === "pending") {
    return true;
  }

  return false;
};
```

---

## 9. Reporting & Analytics

Track these metrics in your admin dashboard:

- Total cancellation requests
- Approval rate
- Rejection rate
- Average processing time
- Refund amount processed
- Top cancellation reasons
- Cancellation rate by payment method
- Time-based cancellation trends

---

**That's it!** You now have a complete guide to implement the admin cancellation approval system. Implement this when you're ready to add admin functionality to your application.
