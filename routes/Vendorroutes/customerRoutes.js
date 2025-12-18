const express = require("express");
const router = express.Router();
const authenticateToken = require("../../middleware/authMiddleware");
const {
  getAllCustomers,
  getCustomerInsights,
  getCustomerDetails,
} = require("../../controllers/VendorControllers/customerController");
// Protect routes (admin only for now, can adjust for vendors)
router.use(authenticateToken);

router.get("/", getAllCustomers);
router.get("/insights", getCustomerInsights);
router.get("/:customerId", getCustomerDetails);

module.exports = router;
