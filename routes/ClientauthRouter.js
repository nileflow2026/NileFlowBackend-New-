const express = require("express");
const router = express.Router();
const {
  signupcustomer,
  signincustomer,
  handleRefreshToken,
  getCurrentCustomer,
  logoutcustomer,
  getCustomerPreferences,
  updateCustomerPreferences,
} = require("../controllers/UserControllers/ClientauthController");
const {
  verifyCustomer,
  resendVerificationCode,
  verifyCustomerMobile,
} = require("../services/send-confirmation");
const authMiddleware = require("../middleware/authMiddleware");
const { log } = require("winston");

router.post("/signup/customer", signupcustomer);
router.post("/signin/customer", signincustomer);

router.post("/refresh", handleRefreshToken);
router.post("/resend-code", resendVerificationCode);
router.post("/verify", verifyCustomer);
router.post("/verify-customer", verifyCustomerMobile);
router.get("/getCustomerProfile", authMiddleware, getCurrentCustomer);
// routes/ClientauthRouter.js
router.get("/preferences", authMiddleware, getCustomerPreferences);
router.put("/preferences", authMiddleware, updateCustomerPreferences);
router.post("/logoutCustomer", authMiddleware, logoutcustomer);
module.exports = router;
