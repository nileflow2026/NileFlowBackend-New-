// routes/vendorOrderRoutes.js
const express = require("express");
const router = express.Router();
const authenticateToken = require("../../middleware/authMiddleware");
const {
  getvendorOrders,
  updateorderstatus,
} = require("../../controllers/VendorControllers/vendorOrderController");

router.use(authenticateToken);

router.get("/orders", getvendorOrders);
router.put("/orders/:orderId/status", updateorderstatus);

module.exports = router;
