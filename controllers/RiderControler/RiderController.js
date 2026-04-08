// routes/riderRoutes.js
const express = require("express");
const { db } = require("../../services/appwriteService");
const { Query, ID } = require("node-appwrite");
const { env } = require("../../src/env");
const { storage } = require("../../src/appwrite");
const {
  sendRatingRequestEmail,
  scheduleRatingReminder,
} = require("../../services/emailService");

/**
 * Get Riders List
 */
const getRiders = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0, search } = req.query;

    const queries = [
      Query.limit(parseInt(limit)),
      Query.offset(parseInt(offset)),
      Query.orderDesc("createdAt"),
    ];

    if (status) {
      queries.push(Query.equal("status", status));
    }

    if (search) {
      queries.push(Query.search("name", search));
    }

    const riders = await db.listDocuments(
      env.RIDER_DATABASE_ID,
      env.RIDER_COLLECTION_ID,
      queries
    );

    // Remove password from all rider documents
    const sanitizedRiders = riders.documents.map((rider) => {
      const { password, ...sanitizedRider } = rider;
      return sanitizedRider;
    });

    res.json({
      success: true,
      riders: sanitizedRiders,
      total: riders.total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error("Get riders error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch riders",
    });
  }
};

/**
 * Get Rider Profile
 */
const getRiderProfile = async (req, res) => {
  try {
    const rider = await db.getDocument(
      env.RIDER_DATABASE_ID,
      env.RIDER_COLLECTION_ID,
      req.rider.riderId
    );

    const { password, ...sanitizedRider } = rider;

    res.json({
      success: true,
      rider: sanitizedRider,
    });
  } catch (error) {
    console.error("Get rider profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch profile",
    });
  }
};

/**
 * Update Rider Profile
 */
const updateRiderProfile = async (req, res) => {
  try {
    const { name, phone, vehicleType, vehicleNumber, licenseNumber } = req.body;

    const updateData = {
      updatedAt: new Date().toISOString(),
    };

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (vehicleType) updateData.vehicleType = vehicleType;
    if (vehicleNumber) updateData.vehicleNumber = vehicleNumber;
    if (licenseNumber) updateData.licenseNumber = licenseNumber;

    const updatedRider = await db.updateDocument(
      env.RIDER_DATABASE_ID,
      env.RIDER_COLLECTION_ID,
      req.rider.riderId,
      updateData
    );

    const { password, ...sanitizedRider } = updatedRider;

    res.json({
      success: true,
      message: "Profile updated successfully",
      rider: sanitizedRider,
    });
  } catch (error) {
    console.error("Update rider profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update profile",
    });
  }
};

/**
 * Update Rider Status (online/offline/busy)
 */
const updateRiderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["online", "offline", "busy"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be: online, offline, or busy",
      });
    }

    const updatedRider = await db.updateDocument(
      env.RIDER_DATABASE_ID,
      env.RIDER_COLLECTION_ID,
      req.rider.riderId,
      {
        status,
        updatedAt: new Date().toISOString(),
      }
    );

    res.json({
      success: true,
      message: "Status updated successfully",
      status: updatedRider.status,
    });
  } catch (error) {
    console.error("Update rider status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update status",
    });
  }
};

/**
 * Get Rider Deliveries
 */
const getRiderDeliveries = async (req, res) => {
  try {
    const { status, limit = 50, includeCustomerDetails = true } = req.query;

    // Debug logging
    console.log("getRiderDeliveries called with:", {
      riderId: req.rider?.riderId,
      status,
      limit,
      includeCustomerDetails,
      database: env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
      collection: env.DELIVERIES_COLLECTION_ID,
    });

    if (!req.rider?.riderId) {
      return res.status(401).json({
        success: false,
        error: "Rider authentication required",
      });
    }

    const queries = [
      Query.equal("riderId", req.rider.riderId),
      Query.limit(parseInt(limit)),
      Query.orderDesc("createdAt"),
    ];

    if (status) {
      // Handle comma-separated status values
      const statusArray = status.split(",").map((s) => s.trim());
      if (statusArray.length === 1) {
        queries.push(Query.equal("status", statusArray[0]));
      } else {
        // Use Query.or for multiple statuses
        queries.push(
          Query.or([...statusArray.map((s) => Query.equal("status", s))])
        );
      }
    }

    console.log(
      "Querying with:",
      queries.map((q) => q.toString())
    );

    const deliveries = await db.listDocuments(
      env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
      env.DELIVERIES_COLLECTION_ID,
      queries
    );

    console.log(
      `Found ${deliveries.documents.length} deliveries for rider ${req.rider.riderId}`
    );

    // Enhance deliveries with customer and order details if needed
    const enhancedDeliveries = await Promise.all(
      deliveries.documents.map(async (delivery) => {
        let enhancedDelivery = { ...delivery };

        // If customer details are missing in delivery, fetch them
        if (
          includeCustomerDetails === "true" &&
          delivery.customerId &&
          !delivery.customerName
        ) {
          try {
            const customer = await db.getDocument(
              env.APPWRITE_DATABASE_ID,
              env.APPWRITE_USER_COLLECTION_ID,
              delivery.customerId
            );

            enhancedDelivery.customerName =
              customer.name ||
              customer.fullName ||
              `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
              "Customer Name Not Available";
            enhancedDelivery.customerPhone =
              customer.phone || customer.phoneNumber || "";
            enhancedDelivery.customerEmail = customer.email || "";

            console.log(
              `Enhanced delivery ${delivery.$id} with customer: ${enhancedDelivery.customerName}`
            );
          } catch (customerError) {
            console.log(
              `Could not fetch customer for delivery ${delivery.$id}:`,
              customerError.message
            );
            enhancedDelivery.customerName = "Customer Name Not Available";
            enhancedDelivery.customerPhone = "";
            enhancedDelivery.customerEmail = "";
          }
        }

        // If order details are missing, fetch them
        if (delivery.orderId && (!delivery.totalAmount || !delivery.items)) {
          try {
            const order = await db.getDocument(
              env.APPWRITE_DATABASE_ID,
              env.APPWRITE_ORDERS_COLLECTION ||
                env.APPWRITE_ORDERS_COLLECTION_ID,
              delivery.orderId
            );

            // Fill missing order details
            if (!enhancedDelivery.totalAmount) {
              enhancedDelivery.totalAmount =
                order.totalAmount || order.total || order.amount || 0;
            }
            if (
              !enhancedDelivery.items ||
              enhancedDelivery.items.length === 0
            ) {
              enhancedDelivery.items = order.items || [];
            }
            if (!enhancedDelivery.deliveryFee) {
              enhancedDelivery.deliveryFee = order.deliveryFee || 0;
            }
            if (!enhancedDelivery.subTotal) {
              enhancedDelivery.subTotal = order.subTotal || order.subtotal || 0;
            }

            console.log(`Enhanced delivery ${delivery.$id} with order details`);
          } catch (orderError) {
            console.log(
              `Could not fetch order for delivery ${delivery.$id}:`,
              orderError.message
            );
          }
        }

        return enhancedDelivery;
      })
    );

    res.json({
      success: true,
      deliveries: enhancedDeliveries,
      total: deliveries.total,
    });
  } catch (error) {
    console.error("Get rider deliveries error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch deliveries",
    });
  }
};

/**
 * Debug: Get All Deliveries (for troubleshooting)
 */
const getAllDeliveries = async (req, res) => {
  try {
    const deliveries = await db.listDocuments(
      env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
      env.DELIVERIES_COLLECTION_ID,
      [Query.limit(100), Query.orderDesc("createdAt")]
    );

    console.log(
      "All deliveries:",
      deliveries.documents.map((d) => ({
        id: d.$id,
        riderId: d.riderId,
        status: d.status,
        assignedAt: d.assignedAt,
      }))
    );

    res.json({
      success: true,
      deliveries: deliveries.documents,
      total: deliveries.total,
      message: "Debug: All deliveries retrieved",
    });
  } catch (error) {
    console.error("Get all deliveries error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch all deliveries",
    });
  }
};

/**
 * Get Rider Earnings
 */
const getRiderEarnings = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    console.log(`📊 Getting earnings for rider ${req.rider.riderId}:`, {
      startDate,
      endDate,
      database: env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
      collection: env.DELIVERIES_COLLECTION_ID,
    });

    const queries = [
      Query.equal("riderId", req.rider.riderId), // ✅ Rider match
      Query.equal("paymentStatus", "completed"), // ✅ Only completed payments
    ];

    if (startDate) {
      // Convert date to start of day in ISO format
      const startDateTime = new Date(
        startDate + "T00:00:00.000Z"
      ).toISOString();
      queries.push(Query.greaterThanEqual("completedAt", startDateTime));
      console.log(`📅 Filtering from: ${startDateTime}`);
    }

    if (endDate) {
      // Convert date to end of day in ISO format
      const endDateTime = new Date(endDate + "T23:59:59.999Z").toISOString();
      queries.push(Query.lessThanEqual("completedAt", endDateTime));
      console.log(`📅 Filtering to: ${endDateTime}`);
    }

    console.log(
      `🔍 Earnings queries:`,
      queries.map((q) => q.toString())
    );

    const deliveries = await db.listDocuments(
      env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID, // Fixed: Use consistent database pattern
      env.DELIVERIES_COLLECTION_ID,
      queries
    );

    console.log(`📦 Found ${deliveries.documents.length} completed deliveries`);

    // Log details of found deliveries for debugging
    deliveries.documents.forEach((delivery, index) => {
      console.log(`  Delivery ${index + 1}:`, {
        id: delivery.$id,
        status: delivery.status,
        paymentStatus: delivery.paymentStatus,
        riderEarning: delivery.riderEarning,
        completedAt: delivery.completedAt,
        totalAmount: delivery.totalAmount,
      });
    });

    const totalEarnings = deliveries.documents.reduce(
      (sum, delivery) => sum + (delivery.riderEarning || 0),
      0
    );

    console.log(`💰 Total earnings calculated: ${totalEarnings}`);

    res.json({
      success: true,
      totalEarnings,
      deliveryCount: deliveries.total,
      deliveries: deliveries.documents,
    });
  } catch (error) {
    console.error("Get rider earnings error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch earnings",
    });
  }
};

/**
 * Update Delivery Status
 */
const updateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ["picked_up", "in_transit", "delivered", "failed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be: ${validStatuses.join(", ")}`,
      });
    }

    // Verify delivery belongs to this rider
    const delivery = await db.getDocument(
      env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
      env.DELIVERIES_COLLECTION_ID,
      deliveryId
    );

    if (delivery.riderId !== req.rider.riderId) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const updateData = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (notes) updateData.notes = notes;
    if (status === "delivered" || status === "failed") {
      updateData.completedAt = new Date().toISOString();
    }

    // Set payment status and rider earning when delivery is completed
    if (status === "delivered") {
      updateData.paymentStatus = "completed";
      // Set rider earning if not already set (you can customize this amount)
      if (!delivery.riderEarning) {
        updateData.riderEarning = delivery.deliveryFee || 50; // Default rider earning or use delivery fee
      }
    }

    const updatedDelivery = await db.updateDocument(
      env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
      env.DELIVERIES_COLLECTION_ID,
      deliveryId,
      updateData
    );

    // Get rider info for notifications and emails
    let rider = null;
    try {
      console.log(`📋 Fetching rider information...`);
      rider = await db.getDocument(
        env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
        env.RIDER_COLLECTION_ID,
        req.rider.riderId
      );
      console.log(`✅ Rider found: ${rider.name} (${rider.$id})`);
    } catch (riderError) {
      console.error("❌ Failed to fetch rider info:", riderError.message);
      // Fallback rider name
      rider = { name: "Rider", $id: req.rider.riderId };
    }

    // Create admin notification for delivery status update
    try {
      console.log(
        `🔄 Creating admin notification for delivery status update...`
      );
      console.log(
        `Delivery ID: ${deliveryId}, New Status: ${status}, Rider ID: ${req.rider.riderId}`
      );

      // Get rider info for the notification
      console.log(`📋 Using rider information for notification...`);

      console.log(`📤 Creating notification document...`);
      console.log(`Database: ${env.APPWRITE_DATABASE_ID}`);
      console.log(`Collection: ${env.APPWRITE_NOTIFICATIONS_COLLECTION_ID}`);

      // Create notification for admin
      const notificationData = {
        message: `Delivery ${deliveryId} status updated to "${status}" by rider ${rider.name}`,
        username: rider.name, // Add username field
        type: "delivery_update",
        timestamp: new Date().toISOString(),
        read: false,
        userId: "admin", // For admin notifications
        metadata: JSON.stringify({
          deliveryId: deliveryId,
          riderId: req.rider.riderId,
          riderName: rider.name,
          oldStatus: delivery.status,
          newStatus: status,
          customerName: updatedDelivery.customerName || "Customer",
          notes: notes || "",
          updatedAt: updateData.updatedAt,
        }),
      };

      console.log(
        `📝 Notification data:`,
        JSON.stringify(notificationData, null, 2)
      );

      const createdNotification = await db.createDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
        ID.unique(),
        notificationData
      );

      console.log(`🎉 Admin notification created successfully!`);
      console.log(`Notification ID: ${createdNotification.$id}`);
      console.log(
        `📱 Admin notification created for delivery ${deliveryId} status change to ${status}`
      );
    } catch (notificationError) {
      console.error(`❌ Failed to create admin notification:`, {
        error: notificationError.message,
        code: notificationError.code,
        type: notificationError.type,
        deliveryId,
        riderId: req.rider.riderId,
        status,
      });

      // Log environment variables for debugging
      console.error(`🔍 Debug info:`, {
        APPWRITE_DATABASE_ID: env.APPWRITE_DATABASE_ID,
        NOTIFICATIONS_COLLECTION_ID: env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
        RIDER_DATABASE_ID: env.RIDER_DATABASE_ID,
        RIDER_COLLECTION_ID: env.RIDER_COLLECTION_ID,
      });

      // Don't fail the main operation if notification fails
    }

    // If delivery is completed, prepare rating data for customer
    let ratingInfo = null;
    if (status === "delivered") {
      console.log(
        `🎯 Delivery marked as DELIVERED - processing rating setup for ${deliveryId}`
      );

      ratingInfo = {
        canRate: true,
        ratingUrl: `${
          process.env.FRONTEND_URL_PROD || "https://nileflowafrica.com"
        }/rate-delivery/${deliveryId}`,
        deliveryId: deliveryId,
        riderId: delivery.riderId,
        customerEmail: updatedDelivery.customerEmail,
      };
      console.log(
        `📋 Delivery completed - customer can now rate: ${deliveryId}`
      );
      console.log(
        `🔍 Rating info prepared:`,
        JSON.stringify(ratingInfo, null, 2)
      );

      // Debug environment variables
      console.log(`🔧 Email settings check:`);
      console.log(
        `  ENABLE_RATING_EMAILS: ${process.env.ENABLE_RATING_EMAILS}`
      );
      console.log(
        `  ENABLE_RATING_REMINDERS: ${process.env.ENABLE_RATING_REMINDERS}`
      );
      console.log(`  Customer Email: ${updatedDelivery.customerEmail}`);
      console.log(`  Has customer email: ${!!updatedDelivery.customerEmail}`);

      // Send rating request email (defaults to enabled if not specified)
      const isEmailEnabled = process.env.ENABLE_RATING_EMAILS !== "false"; // Default to true
      const isReminderEnabled = process.env.ENABLE_RATING_REMINDERS !== "false"; // Default to true

      console.log(`📧 Updated email settings:`);
      console.log(`  Email enabled: ${isEmailEnabled}`);
      console.log(`  Reminders enabled: ${isReminderEnabled}`);

      if (isEmailEnabled && updatedDelivery.customerEmail) {
        console.log(
          `✅ Email conditions met - attempting to send rating request email`
        );
        try {
          const emailSent = await sendRatingRequestEmail({
            customerEmail: updatedDelivery.customerEmail,
            customerName: updatedDelivery.customerName,
            deliveryId: deliveryId,
            orderId: updatedDelivery.orderId,
            riderName: rider.name,
            totalAmount: updatedDelivery.totalAmount,
            ratingUrl: ratingInfo.ratingUrl,
          });

          if (emailSent) {
            console.log(
              `🎉 Rating request email sent successfully for delivery ${deliveryId}`
            );
          } else {
            console.log(
              `⚠️ Rating request email returned false for delivery ${deliveryId}`
            );
          }
        } catch (emailError) {
          console.error("❌ Failed to send rating email:", emailError.message);
          console.error("❌ Full email error:", emailError);
          // Don't fail the main operation if email fails
        }

        // Schedule reminder email (4 hours later if not rated)
        if (isReminderEnabled) {
          console.log(
            `📅 Scheduling rating reminder for delivery ${deliveryId}`
          );
          scheduleRatingReminder(deliveryId);
        } else {
          console.log(
            `⏭️ Rating reminders disabled - skipping reminder for delivery ${deliveryId}`
          );
        }
      } else {
        console.log(`❌ Email NOT sent - conditions not met:`);
        console.log(`  Email enabled: ${isEmailEnabled}`);
        console.log(`  Has customerEmail: ${!!updatedDelivery.customerEmail}`);
        console.log(
          `  CustomerEmail value: "${updatedDelivery.customerEmail}"`
        );
      }
    } else {
      console.log(
        `⏭️ Delivery status "${status}" - not triggering rating system`
      );
    }

    res.json({
      success: true,
      message: "Delivery status updated successfully",
      delivery: updatedDelivery,
      ratingInfo: ratingInfo,
    });
  } catch (error) {
    console.error("Update delivery status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update delivery status",
    });
  }
};

const uploadDocumentasync = async (req, res) => {
  const { documentType } = req.body; // 'license', 'vehicle_registration', 'id_card'
  const file = req.files?.document;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    // Upload to Appwrite Storage
    const uploadedFile = await storage.createFile(
      env.RIDER_DOCUMENTS_BUCKET_ID,
      ID.unique(),
      file
    );

    // Create verification record
    await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.RIDER_DOCUMENTS_COLLECTION_ID,
      ID.unique(),
      {
        riderId: req.rider.riderId,
        documentType,
        fileId: uploadedFile.$id,
        status: "pending", // pending, approved, rejected
        uploadedAt: new Date().toISOString(),
      }
    );

    res.json({
      success: true,
      message: "Document uploaded successfully",
      fileId: uploadedFile.$id,
    });
  } catch (error) {
    console.error("Document upload error:", error);
    res.status(500).json({ error: "Failed to upload document" });
  }
};

// Admin endpoint to approve/reject documents
const verifyDocument = async (req, res) => {
  const { documentId, status, notes } = req.body; // status: 'approved' or 'rejected'

  await db.updateDocument(
    env.APPWRITE_DATABASE_ID,
    env.RIDER_DOCUMENTS_COLLECTION_ID,
    documentId,
    {
      status,
      verifiedAt: new Date().toISOString(),
      verifiedBy: req.admin.adminId,
      notes: notes || "",
    }
  );

  // Check if all documents are verified
  const documents = await db.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.RIDER_DOCUMENTS_COLLECTION_ID,
    [Query.equal("riderId", riderId)]
  );

  const allApproved = documents.documents.every(
    (doc) => doc.status === "approved"
  );

  if (allApproved) {
    // Activate rider account
    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.RIDER_COLLECTION_ID,
      riderId,
      {
        isActive: true,
        verificationStatus: "verified",
      }
    );
  }

  res.json({ success: true, message: "Document verification updated" });
};

// Backend - Real-time location tracking
const updateLocation = async (req, res) => {
  const { latitude, longitude, accuracy } = req.body;

  await db.updateDocument(
    env.APPWRITE_DATABASE_ID,
    env.RIDER_COLLECTION_ID,
    req.rider.riderId,
    {
      currentLatitude: latitude,
      currentLongitude: longitude,
      locationAccuracy: accuracy,
      lastLocationUpdate: new Date().toISOString(),
    }
  );

  res.json({ success: true });
};

// Get nearby available riders
const getNearbyRiders = async (req, res) => {
  const { latitude, longitude, radius = 5 } = req.query; // radius in km

  // This is a simplified version. In production, use geospatial queries
  const riders = await db.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.RIDER_COLLECTION_ID,
    [Query.equal("status", "online")]
  );

  // Calculate distance and filter
  const nearbyRiders = riders.documents.filter((rider) => {
    const distance = calculateDistance(
      latitude,
      longitude,
      rider.currentLatitude,
      rider.currentLongitude
    );
    return distance <= radius;
  });

  res.json({ success: true, riders: nearbyRiders });
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = {
  getRiders,
  getRiderProfile,
  updateRiderProfile,
  updateRiderStatus,
  getRiderDeliveries,
  getAllDeliveries,
  getRiderEarnings,
  updateDeliveryStatus,
  uploadDocumentasync,
  verifyDocument,
  updateLocation,
  getNearbyRiders,
};
