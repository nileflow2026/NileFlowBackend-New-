const express = require("express");
const {
  sendForgotPasswordEmail,
  resetPassword,
} = require("../controllers/UserControllers/forgotPasswordController");
const router = express.Router();

router.post("/forgot-password", sendForgotPasswordEmail);
router.post("/reset-password", resetPassword);

module.exports = router;
