const express = require("express");
const router = express.Router();
const authenticateToken = require("../../middleware/authMiddleware");
const {
  getVendorNotifications,
  markVendorNotificationsAsRead,
  clearVendorNotifications,
} = require("../../controllers/VendorControllers/VendorNotificationControler");

// Protected routes - all routes require authentication
router.get("/", authenticateToken, getVendorNotifications);
router.post("/mark-as-read", authenticateToken, markVendorNotificationsAsRead);
router.delete("/clear-all", authenticateToken, clearVendorNotifications);

module.exports = router;
