const { ID, Permission, Query } = require("node-appwrite");
const { db } = require("../../services/appwriteService");
const { env } = require("../../src/env");

const createNotificationInternal = async (notificationData) => {
  try {
    const { message, type, username, email, userId } = notificationData;

    if (!message || !type || !userId) {
      console.error(
        "Error creating notification: Missing required fields in data"
      );
      return; // Or throw an error if you want the signup to fail
    }

    const response = await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      ID.unique(),
      {
        message,
        username,
        type,
        timestamp: new Date().toISOString(),
        read: false,
        email,
        userId,
      },
      [
        Permission.read(`user:${userId}`),
        Permission.update(`user:${userId}`),
        Permission.delete(`user:${userId}`),
      ]
    );

    console.log("Notification created:", response);
    return response;
  } catch (error) {
    console.error("❌ Internal notification creation failed:", error.message);
    // Decide if you want to re-throw this error or just log it
    // If notification creation failure should not break signup, just log.
    // throw new Error("Failed to create internal notification");
  }
};
/* const createNotification = async (req, res) => {
  try {
    // ✅ Handle both Express request AND direct object calls
    let notificationData;

    if (req && req.body) {
      // Case 1: Called from Express route (mobile frontend)
      notificationData = req.body;
    } else {
      // Case 2: Called directly with object (from your controller)
      notificationData = req; // 'req' is actually the notification data object
    }
    const { message, type, username, email, userId } = notificationData;



    if (!userId || !type || !userId) {
      if (res && res.status) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }
      throw new Error("Missing required fields");
    }

    const response = await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      ID.unique(),
      {
        message,
        username,
        type,
        timestamp: new Date().toISOString(),
        read: false,
        email,
        userId,
      },
      [
        Permission.read(`user:${userId}`),
        Permission.update(`user:${userId}`),
        Permission.delete(`user:${userId}`),
      ]
    );

    res.status(201).json({ notification: response });
  } catch (error) {
    console.error("❌ Notification creation failed:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}; */

const createNotification = async (req, res) => {
  try {
    // ✅ Handle both Express request AND direct object calls
    let notificationData;

    if (req && req.body) {
      // Case 1: Called from Express route (mobile frontend)
      notificationData = req.body;
    } else {
      // Case 2: Called directly with object (from your controller)
      notificationData = req; // 'req' is actually the notification data object
    }

    const { message, type, username, email, userId } = notificationData;

    // 🔍 Debug: Log what we received
    console.log("📝 Notification data received:", {
      message,
      type,
      username,
      email,
      userId,
    });

    // ✅ FIX: Check for res properly
    if (!userId || !type) {
      if (res && typeof res.status === "function") {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: userId and type",
        });
      }
      // If called without res (from controller), throw error
      throw new Error("Missing required fields: userId and type");
    }

    const response = await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      ID.unique(),
      {
        message: message || `New ${type} notification`,
        username: username || "Customer",
        type,
        timestamp: new Date().toISOString(),
        read: false,
        email: email || "",
        userId,
      },
      [
        Permission.read(`user:${userId}`),
        Permission.update(`user:${userId}`),
        Permission.delete(`user:${userId}`),
      ]
    );

    // ✅ FIX: Only use res if it exists and has status method
    if (res && typeof res.status === "function") {
      return res.status(201).json({
        success: true,
        notification: response,
      });
    }

    // ✅ If called without res (from controller), return the response
    return {
      success: true,
      notification: response,
    };
  } catch (error) {
    console.error("❌ Notification creation failed:", error.message);

    // ✅ FIX: Only use res if it exists
    if (res && typeof res.status === "function") {
      return res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message,
      });
    }

    // ✅ If called without res (from controller), throw error
    throw error;
  }
};

const fetchCustomerNotification = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No user information found." });
    }

    let userId = req.user.userId; // Now safely extract
    console.log("Raw userId:", userId);

    if (!userId) {
      return res.status(400).json({ error: "Invalid token: Missing user ID." });
    }

    // Validate and sanitize userId for Appwrite UID requirements
    if (typeof userId !== "string") {
      userId = String(userId);
    }

    // Remove invalid characters and ensure it meets Appwrite UID requirements
    userId = userId
      .replace(/[^a-zA-Z0-9_]/g, "") // Keep only valid characters
      .replace(/^_+/, "") // Remove leading underscores
      .substring(0, 36); // Limit to 36 characters

    if (!userId || userId.length === 0) {
      return res
        .status(400)
        .json({ error: "Invalid user ID format after sanitization." });
    }

    console.log("Sanitized userId:", userId);

    const result = await db.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      [
        Query.equal("userId", userId),
        Query.equal("type", "userNotification"),
        Query.orderDesc("$createdAt"),
      ],
      [
        Permission.read(`user:${userId}`),
        Permission.update(`user:${userId}`),
        Permission.delete(`user:${userId}`),
      ]
    );
    /*  console.log('Fetched admin notifications:', result.documents); */
    res.status(200).json({ result: result.documents });
  } catch (err) {
    console.error("Failed to fetch customer notifications:", err.message);
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.userId;

    const result = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      [
        Query.equal("userId", userId),
        Query.equal("type", "userNotification"),
        Query.equal("read", false),
      ]
    );

    for (const note of result.documents) {
      await db.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
        note.$id,
        { read: true }
      );
    }

    return res
      .status(200)
      .json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Failed to mark notifications as read:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createNotification,
  fetchCustomerNotification,
  createNotificationInternal,
  markAllNotificationsAsRead,
};
