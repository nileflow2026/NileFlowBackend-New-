const express = require("express");
const router = express.Router();
const {
  getNotifications,
  fetchAdminNotifications,
  clearAllNotifications,
  markNotificationsAsRead,
} = require("../controllers/AdminControllers/notificationController");
const authenticateToken = require("../middleware/authMiddleware");

// Protected route
router.get("/", getNotifications);
router.get("/admin", authenticateToken, fetchAdminNotifications);
router.post("/clear", authenticateToken, clearAllNotifications);
router.post("/mark-as-read", authenticateToken, markNotificationsAsRead);
module.exports = router;
