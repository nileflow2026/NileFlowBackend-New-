const express = require("express");
const router = express.Router();
const authenticateToken = require("../../middleware/authMiddleware");
const {
  getVendorNotifications,
} = require("../../controllers/VendorControllers/VendorNotificationControler");

// Protected route
router.get("/", getVendorNotifications);

module.exports = router;
