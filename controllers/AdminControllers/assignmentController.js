// routes/assignment.js
const express = require("express");
const router = express.Router();
const sdk = require("node-appwrite");

const AssignRider = async (req, res) => {
  try {
    const { orderId } = req.body;

    const client = getAppwriteClient();
    const database = new sdk.Databases(client);

    // Get order details
    const order = await database.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_COLLECTION_ID,
      orderId
    );

    // Auto-assignment logic
    const assignmentResult = await autoAssignRider(orderId, order, database);

    res.json({
      success: true,
      data: assignmentResult,
    });
  } catch (error) {
    console.error("Auto-assignment error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Middleware to initialize Appwrite client
const getAppwriteClient = () => {
  return new sdk.Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
};

// POST /api/assignment/auto-assign
router.post("/auto-assign");

// GET /api/assignment/offers/:riderId
router.get("/offers/:riderId", async (req, res) => {
  try {
    const { riderId } = req.params;

    const client = getAppwriteClient();
    const database = new sdk.Databases(client);

    // Get PENDING offers for this rider
    const offers = await database.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.ASSIGNMENT_OFFERS_COLLECTION_ID,
      [
        sdk.Query.equal("riderId", riderId),
        sdk.Query.equal("status", "PENDING"),
        sdk.Query.greaterThan("expiresAt", new Date().toISOString()),
      ]
    );

    // Get order details for each offer
    const offersWithDetails = await Promise.all(
      offers.documents.map(async (offer) => {
        try {
          const order = await database.getDocument(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_COLLECTION_ID,
            offer.orderId
          );

          return {
            ...offer,
            orderDetails: {
              orderId: order.$id,
              customerName: order.customerName || order.username,
              pickupAddress: order.pickupAddress || order.restaurantAddress,
              deliveryAddress: order.deliveryAddress,
              totalAmount: order.totalAmount,
              riderEarning: order.riderEarning || order.deliveryFee,
              items: order.items || [],
            },
          };
        } catch (err) {
          console.error("Error fetching order details:", err);
          return offer;
        }
      })
    );

    res.json({
      success: true,
      data: {
        offers: offersWithDetails,
        count: offersWithDetails.length,
      },
    });
  } catch (error) {
    console.error("Error fetching assignment offers:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/assignment/respond
router.post("/respond", async (req, res) => {
  try {
    const { offerId, riderId, response } = req.body; // response: 'accept' or 'reject'

    if (!["accept", "reject"].includes(response)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid response type" });
    }

    const client = getAppwriteClient();
    const database = new sdk.Databases(client);

    // Get the offer
    const offer = await database.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.ASSIGNMENT_OFFERS_COLLECTION_ID,
      offerId
    );

    // Security check
    if (offer.riderId !== riderId) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    if (offer.status !== "PENDING") {
      return res
        .status(400)
        .json({ success: false, error: "Offer already processed" });
    }

    // Check if offer expired
    if (new Date(offer.expiresAt) < new Date()) {
      await database.updateDocument(
        process.env.APPWRITE_DATABASE_ID,
        process.env.ASSIGNMENT_OFFERS_COLLECTION_ID,
        offerId,
        { status: "EXPIRED" }
      );
      return res.status(400).json({ success: false, error: "Offer expired" });
    }

    const newStatus = response === "accept" ? "ACCEPTED" : "REJECTED";

    // Update offer status
    await database.updateDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.ASSIGNMENT_OFFERS_COLLECTION_ID,
      offerId,
      { status: newStatus }
    );

    // Get order
    const order = await database.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_COLLECTION_ID,
      offer.orderId
    );

    if (response === "accept") {
      // Update order assignment
      await database.updateDocument(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_COLLECTION_ID,
        offer.orderId,
        {
          assignmentStatus: "ASSIGNED",
          assignedRiderId: riderId,
          orderStatus: "OUT_FOR_DELIVERY",
        }
      );

      // Update rider's active deliveries count
      await database.updateDocument(
        process.env.APPWRITE_DATABASE_ID,
        process.env.RIDERS_COLLECTION_ID,
        riderId,
        {
          activeDeliveries: sdk.Query.increment(1),
        }
      );

      // Create delivery record for rider
      await database.createDocument(
        process.env.APPWRITE_DATABASE_ID,
        process.env.DELIVERIES_COLLECTION_ID, // Your existing deliveries collection
        sdk.ID.unique(),
        {
          orderId: offer.orderId,
          riderId: riderId,
          status: "assigned",
          pickupAddress: order.pickupAddress || order.restaurantAddress,
          deliveryAddress: order.deliveryAddress,
          customerName: order.customerName || order.username,
          riderEarning: order.riderEarning || order.deliveryFee,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
    } else {
      // REJECTED - clear assignment
      await database.updateDocument(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_COLLECTION_ID,
        offer.orderId,
        {
          assignedRiderId: null,
          assignmentStatus: "PENDING_RETRY",
        }
      );

      // Trigger retry with next best rider
      setTimeout(async () => {
        try {
          await autoAssignRider(offer.orderId, order, database);
        } catch (err) {
          console.error("Auto-retry failed:", err);
        }
      }, 1000); // 1 second delay before retry
    }

    res.json({
      success: true,
      data: {
        status: newStatus,
        orderId: offer.orderId,
      },
    });
  } catch (error) {
    console.error("Error handling rider response:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Auto-assignment engine function
async function autoAssignRider(orderId, orderData, database) {
  try {
    // 1. Get all available riders
    const riders = await database.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.RIDERS_COLLECTION_ID,
      [
        sdk.Query.equal("availability", "AVAILABLE"),
        sdk.Query.lessThan("activeDeliveries", 5), // Max 4 concurrent deliveries
        sdk.Query.equal("status", "online"), // Only online riders
      ]
    );

    if (riders.documents.length === 0) {
      console.log("No available riders found");

      // Update order with failed assignment
      await database.updateDocument(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_COLLECTION_ID,
        orderId,
        {
          assignmentStatus: "FAILED",
          assignmentAttempts: sdk.Query.append([
            {
              timestamp: new Date().toISOString(),
              reason: "NO_AVAILABLE_RIDERS",
            },
          ]),
        }
      );

      // Notify admin
      await database.createDocument(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
        sdk.ID.unique(),
        {
          message: `⚠️ Order #${orderId} failed auto-assignment: No available riders`,
          type: "adminAlert",
          timestamp: new Date().toISOString(),
          read: false,
          severity: "warning",
        },
        [sdk.Permission.read("role:admin"), sdk.Permission.write("role:admin")]
      );

      return { assigned: false, reason: "NO_AVAILABLE_RIDERS" };
    }

    // 2. Score and rank riders
    const scoredRiders = riders.documents
      .map((rider) => {
        let score = 100;

        // Zone matching bonus
        if (
          orderData.deliveryZone &&
          rider.zones?.includes(orderData.deliveryZone)
        ) {
          score += 50;
        }

        // Active deliveries penalty (more deliveries = lower score)
        score -= (rider.activeDeliveries || 0) * 10;

        // Performance bonus
        if (rider.performanceScore) {
          score += rider.performanceScore;
        }

        // Rating bonus
        if (rider.rating) {
          score += rider.rating * 5;
        }

        // Proximity bonus (if location data available)
        if (orderData.restaurantLocation && rider.currentLocation) {
          // Simple distance calculation (you'd implement actual distance calculation)
          const distance = calculateSimpleDistance(
            orderData.restaurantLocation,
            rider.currentLocation
          );
          if (distance < 5)
            score += 30; // Within 5km
          else if (distance < 10) score += 15; // Within 10km
        }

        return { ...rider, score };
      })
      .sort((a, b) => b.score - a.score);

    // 3. Select best rider
    const bestRider = scoredRiders[0];

    // 4. Create assignment offer (45 second TTL)
    const offerId = sdk.ID.unique();
    const expiresAt = new Date(Date.now() + 45000);

    await database.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.ASSIGNMENT_OFFERS_COLLECTION_ID,
      offerId,
      {
        orderId: orderId,
        riderId: bestRider.$id,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        score: bestRider.score,
        riderName: bestRider.name,
      },
      [
        sdk.Permission.read(`user:${bestRider.$id}`),
        sdk.Permission.update(`user:${bestRider.$id}`),
        sdk.Permission.read("role:admin"),
        sdk.Permission.write("role:admin"),
      ]
    );

    // 5. Update order with pending assignment
    await database.updateDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_COLLECTION_ID,
      orderId,
      {
        assignedRiderId: bestRider.$id,
        assignmentStatus: "PENDING",
        assignmentAttempts: sdk.Query.append([
          {
            riderId: bestRider.$id,
            riderName: bestRider.name,
            timestamp: new Date().toISOString(),
            offerId: offerId,
            status: "PENDING",
            score: bestRider.score,
          },
        ]),
      }
    );

    // 6. Notify rider
    await database.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      sdk.ID.unique(),
      {
        message: `📦 New delivery assignment for order #${orderId.slice(-6)}`,
        userId: bestRider.$id,
        username: bestRider.name,
        orderId: orderId,
        offerId: offerId,
        timestamp: new Date().toISOString(),
        read: false,
        type: "riderAssignment",
        expiresAt: expiresAt.toISOString(),
        data: {
          pickupAddress: orderData.pickupAddress || orderData.restaurantAddress,
          deliveryAddress: orderData.deliveryAddress,
          earnings: orderData.riderEarning || orderData.deliveryFee,
        },
      },
      [
        sdk.Permission.read(`user:${bestRider.$id}`),
        sdk.Permission.write(`user:${bestRider.$id}`),
      ]
    );

    return {
      assigned: true,
      offerId: offerId,
      riderId: bestRider.$id,
      riderName: bestRider.name,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    console.error("Auto-assignment error:", error);
    throw error;
  }
}

// Helper function for simple distance calculation
function calculateSimpleDistance(loc1, loc2) {
  // This is a simplified version - implement proper haversine formula for production
  if (!loc1 || !loc2) return 999;

  const lat1 = loc1.latitude || loc1.lat;
  const lon1 = loc1.longitude || loc1.lng;
  const lat2 = loc2.latitude || loc2.lat;
  const lon2 = loc2.longitude || loc2.lng;

  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;

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

module.exports = router;
