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

const markVendorNotificationsAsRead = async (req, res) => {
  const { ids = [] } = req.body;
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No notification IDs provided" });
    }

    await Promise.all(
      ids.map((id) =>
        db.updateDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
          id,
          { read: true }
        )
      )
    );

    res.json({ success: true, updated: ids.length });
  } catch (error) {
    console.error(
      "Failed to mark vendor notifications as read:",
      error.message
    );
    res.status(500).json({ error: "Failed to update notifications" });
  }
};

const clearVendorNotifications = async (req, res) => {
  try {
    // Get all vendor notifications
    const result = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      [
        Query.equal("type", [
          "product_submitted",
          "product_approved",
          "product_rejected",
          "order_received",
          "payment_processed",
        ]),
        Query.orderDesc("$createdAt"),
      ]
    );

    // Delete all notifications
    const deletions = result.documents.map((doc) =>
      db.deleteDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
        doc.$id
      )
    );

    await Promise.all(deletions);

    res.status(200).json({
      success: true,
      deleted: result.documents.length,
      message: `${result.documents.length} notifications cleared`,
    });
  } catch (error) {
    console.error("Failed to clear vendor notifications:", error.message);
    res.status(500).json({ error: "Failed to clear notifications" });
  }
};

module.exports = {
  getVendorNotifications,
  markVendorNotificationsAsRead,
  clearVendorNotifications,
};
