const express = require("express");
const router = express.Router();
const authenticateToken = require("../../middleware/authMiddleware");
const {
  getVendorNotifications,
  markVendorNotificationsAsRead,
  clearVendorNotifications,
} = require("../../controllers/VendorControllers/VendorNotificationControler");

// Protected route
router.get("/", getVendorNotifications);
router.post("/mark-as-read", markVendorNotificationsAsRead);
router.delete("/clear-all", clearVendorNotifications);

module.exports = router;
