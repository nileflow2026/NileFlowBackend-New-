const { Query, ID, Permission } = require("node-appwrite");
const { db } = require("../../services/appwriteService");
const { env } = require("../../src/env");

const getVendorNotifications = async (req, res) => {
  try {
    const query = [Query.orderDesc("$createdAt")];

    const typeParam = req.query.type;

    if (typeParam) {
      // Split comma-separated types → supports multiple
      const types = typeParam.split(",");

      // Only allow valid types
      const allowed = [
        "product_approved",
        "product_rejected",
        "product_submitted",
      ];
      const filteredTypes = types.filter((t) => allowed.includes(t));

      if (filteredTypes.length > 0) {
        query.unshift(Query.equal("type", filteredTypes));
      }
    }

    const notifications = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      query
    );

    res.status(200).json({ notifications: notifications.documents });
  } catch (error) {
    console.error("Fetching notifications failed:", error.message);
    res.status(500).json({ error: "Failed to fetch notifications." });
  }
};

module.exports = {
  getVendorNotifications,
};
