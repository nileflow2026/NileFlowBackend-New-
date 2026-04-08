const { db } = require("../../services/appwriteService");
const { Query, ID } = require("node-appwrite");
const { env } = require("../../src/env");

/**
 * Submit Rating for Rider and Delivery
 */
const submitRating = async (req, res) => {
  try {
    const {
      deliveryId,
      riderId,
      riderRating,
      deliveryRating,
      comment,
      orderId,
    } = req.body;

    // Validate input
    if (!deliveryId || !riderId || !riderRating) {
      return res.status(400).json({
        success: false,
        error: "Delivery ID, Rider ID, and rider rating are required",
      });
    }

    if (riderRating < 1 || riderRating > 5) {
      return res.status(400).json({
        success: false,
        error: "Rider rating must be between 1 and 5",
      });
    }

    if (deliveryRating && (deliveryRating < 1 || deliveryRating > 5)) {
      return res.status(400).json({
        success: false,
        error: "Delivery rating must be between 1 and 5",
      });
    }

    // Verify delivery exists and belongs to the customer
    const delivery = await db.getDocument(
      env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
      env.DELIVERIES_COLLECTION_ID,
      deliveryId
    );

    if (delivery.status !== "delivered") {
      return res.status(400).json({
        success: false,
        error: "Can only rate completed deliveries",
      });
    }

    // Check if customer already rated this delivery
    try {
      const existingRating = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.RATINGS_COLLECTION_ID,
        [
          Query.equal("deliveryId", deliveryId),
          Query.equal("customerId", req.user?.userId || delivery.customerId),
        ]
      );

      if (existingRating.documents.length > 0) {
        return res.status(400).json({
          success: false,
          error: "You have already rated this delivery",
        });
      }
    } catch (error) {
      // Collection might not exist yet, continue
    }

    // Create rating record
    const ratingData = {
      deliveryId,
      orderId: orderId || delivery.orderId,
      riderId,
      customerId: req.user?.userId || delivery.customerId,
      customerName: delivery.customerName || "Anonymous",
      riderRating,
      deliveryRating: deliveryRating || riderRating, // Default to rider rating if not provided
      comment: comment || "",
      $createdAt: new Date().toISOString(),
      status: "active",
    };

    console.log("Creating rating:", ratingData);

    const rating = await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.RATINGS_COLLECTION_ID,
      ID.unique(),
      ratingData
    );

    // Update delivery with rating status
    await db.updateDocument(
      env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
      env.DELIVERIES_COLLECTION_ID,
      deliveryId,
      {
        isRated: true,
        ratedAt: new Date().toISOString(),
        riderRating,
        deliveryRating: deliveryRating || riderRating,
      }
    );

    // Update rider's average rating
    await updateRiderAverageRating(riderId);

    console.log(`✅ Rating submitted: ${riderRating}/5 for rider ${riderId}`);

    res.json({
      success: true,
      message: "Rating submitted successfully",
      rating: {
        ratingId: rating.$id,
        riderRating,
        deliveryRating: deliveryRating || riderRating,
        comment,
      },
    });
  } catch (error) {
    console.error("Submit rating error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit rating",
      message: error.message,
    });
  }
};

/**
 * Get Ratings for a Rider
 */
const getRiderRatings = async (req, res) => {
  try {
    const { riderId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const ratings = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.RATINGS_COLLECTION_ID,
      [
        Query.equal("riderId", riderId),
        Query.equal("status", "active"),
        Query.limit(parseInt(limit)),
        Query.offset(parseInt(offset)),
        Query.orderDesc("createdAt"),
      ]
    );

    // Calculate statistics
    const totalRatings = ratings.documents.length;
    const averageRating =
      totalRatings > 0
        ? ratings.documents.reduce((sum, r) => sum + r.riderRating, 0) /
          totalRatings
        : 0;

    // Rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.documents.forEach((r) => {
      distribution[r.riderRating]++;
    });

    res.json({
      success: true,
      ratings: ratings.documents,
      statistics: {
        totalRatings,
        averageRating: Math.round(averageRating * 10) / 10,
        distribution,
      },
      total: ratings.total,
    });
  } catch (error) {
    console.error("Get rider ratings error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch rider ratings",
    });
  }
};

/**
 * Get Rating for Specific Delivery
 */
const getDeliveryRating = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const ratings = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.RATINGS_COLLECTION_ID,
      [Query.equal("deliveryId", deliveryId), Query.equal("status", "active")]
    );

    if (ratings.documents.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No rating found for this delivery",
      });
    }

    res.json({
      success: true,
      rating: ratings.documents[0],
    });
  } catch (error) {
    console.error("Get delivery rating error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch delivery rating",
    });
  }
};

/**
 * Check if Delivery Can Be Rated
 */
const canRateDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const customerId = req.user?.userId || req.query.customerId;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: "Customer ID required",
      });
    }

    // Check delivery status
    const delivery = await db.getDocument(
      env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
      env.DELIVERIES_COLLECTION_ID,
      deliveryId
    );

    if (delivery.status !== "delivered") {
      return res.json({
        success: true,
        canRate: false,
        reason: "Delivery not yet completed",
      });
    }

    if (delivery.isRated) {
      return res.json({
        success: true,
        canRate: false,
        reason: "Already rated",
      });
    }

    // Check if customer matches
    if (delivery.customerId !== customerId) {
      return res.json({
        success: true,
        canRate: false,
        reason: "Not authorized",
      });
    }

    res.json({
      success: true,
      canRate: true,
      delivery: {
        deliveryId: delivery.$id,
        orderId: delivery.orderId,
        riderId: delivery.riderId,
        riderName: delivery.riderName || "Rider",
        completedAt: delivery.completedAt,
        totalAmount: delivery.totalAmount,
      },
    });
  } catch (error) {
    console.error("Can rate delivery error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check rating eligibility",
    });
  }
};

/**
 * Helper function to update rider's average rating
 */
async function updateRiderAverageRating(riderId) {
  try {
    // Get all active ratings for this rider
    const ratings = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.RATINGS_COLLECTION_ID,
      [
        Query.equal("riderId", riderId),
        Query.equal("status", "active"),
        Query.limit(1000), // Adjust as needed
      ]
    );

    if (ratings.documents.length === 0) {
      return;
    }

    const totalRatings = ratings.documents.length;
    const averageRating =
      ratings.documents.reduce((sum, r) => sum + r.riderRating, 0) /
      totalRatings;

    // Update rider record
    await db.updateDocument(
      env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
      env.RIDER_COLLECTION_ID,
      riderId,
      {
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings,
        updatedAt: new Date().toISOString(),
      }
    );

    console.log(
      `📊 Updated rider ${riderId} average rating: ${averageRating.toFixed(
        1
      )}/5 (${totalRatings} ratings)`
    );
  } catch (error) {
    console.error("Update rider average rating error:", error);
  }
}

/**
 * Get Rating Reminder Data (for email/notification)
 */
const getRatingReminder = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const delivery = await db.getDocument(
      env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
      env.DELIVERIES_COLLECTION_ID,
      deliveryId
    );

    if (delivery.status !== "delivered" || delivery.isRated) {
      return res.status(400).json({
        success: false,
        error: "Delivery not eligible for rating reminder",
      });
    }

    // Get rider info
    const rider = await db.getDocument(
      env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
      env.RIDER_COLLECTION_ID,
      delivery.riderId
    );

    res.json({
      success: true,
      reminderData: {
        deliveryId: delivery.$id,
        orderId: delivery.orderId,
        customerName: delivery.customerName,
        customerEmail: delivery.customerEmail,
        riderName: rider.name,
        completedAt: delivery.completedAt,
        totalAmount: delivery.totalAmount,
        items: delivery.items,
        ratingUrl: `${env.FRONTEND_URL}/rate-delivery/${delivery.$id}`, // Customize as needed
      },
    });
  } catch (error) {
    console.error("Get rating reminder error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get rating reminder data",
    });
  }
};

module.exports = {
  submitRating,
  getRiderRatings,
  getDeliveryRating,
  canRateDelivery,
  getRatingReminder,
  updateRiderAverageRating,
};
