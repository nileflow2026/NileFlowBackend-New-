// routes/vendorDashboardRoutes.js
const express = require("express");
const router = express.Router();
const {
  getVendorDashboard,
  getVendorPayments,
} = require("../../controllers/VendorControllers/vendorDashboardController");
const authenticateToken = require("../../middleware/authMiddleware");
// Protect vendor routes
router.use(authenticateToken);

// Dashboard routes
router.get("/dashboard", getVendorDashboard);
router.get("/payments", getVendorPayments);

module.exports = router;
