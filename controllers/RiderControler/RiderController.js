// routes/riderRoutes.js
const express = require("express");
const { db } = require("../../services/appwriteService");
const { Query } = require("node-appwrite");
const { env } = require("../../src/env");
const { storage } = require("../../src/appwrite");

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
    const { status, limit = 50 } = req.query;

    const queries = [
      Query.equal("riderId", req.rider.riderId),
      Query.limit(parseInt(limit)),
      Query.orderDesc("createdAt"),
    ];

    if (status) {
      queries.push(Query.equal("status", status));
    }

    const deliveries = await db.listDocuments(
      env.RIDER_DATABASE_ID,
      env.DELIVERIES_COLLECTION_ID,
      queries
    );

    res.json({
      success: true,
      deliveries: deliveries.documents,
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
 * Get Rider Earnings
 */
const getRiderEarnings = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const queries = [
      Query.equal("riderId", req.rider.riderId),
      Query.equal("paymentStatus", "completed"),
    ];

    if (startDate) {
      queries.push(Query.greaterThanEqual("completedAt", startDate));
    }

    if (endDate) {
      queries.push(Query.lessThanEqual("completedAt", endDate));
    }

    const deliveries = await db.listDocuments(
      env.RIDER_DATABASE_ID,
      env.DELIVERIES_COLLECTION_ID,
      queries
    );

    const totalEarnings = deliveries.documents.reduce(
      (sum, delivery) => sum + (delivery.riderEarning || 0),
      0
    );

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
      env.RIDER_DATABASE_ID,
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

    const updatedDelivery = await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.DELIVERIES_COLLECTION_ID,
      deliveryId,
      updateData
    );

    res.json({
      success: true,
      message: "Delivery status updated successfully",
      delivery: updatedDelivery,
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
  getRiderProfile,
  updateRiderProfile,
  updateRiderStatus,
  getRiderDeliveries,
  getRiderEarnings,
  updateDeliveryStatus,
  uploadDocumentasync,
  verifyDocument,
  updateLocation,
  getNearbyRiders,
};
