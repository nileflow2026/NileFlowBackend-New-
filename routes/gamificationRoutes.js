const express = require("express");
const {
  dailyCheckIn,
  spinWheel,
  trackReferral,
  claimReferralReward,
  getRewards,
} = require("../controllers/AdminControllers/gamificationController");
const router = express.Router();

// Gamification Routes
router.post("/checkin", dailyCheckIn); // Daily check-in
router.post("/spin", spinWheel); // Spin the wheel
router.post("/referral", trackReferral); // Track referral
router.post("/referral/claim", claimReferralReward); // Claim referral reward
router.get("/rewards/:userId", getRewards); // Rewards ledger

module.exports = router;
