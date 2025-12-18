const express = require("express");
const router = express.Router();
const {
  addNileMilesOnPurchase,
  getReferralRewards,
} = require("../controllers/AdminControllers/rewardController");

const {
  getNileMilesStatus,
} = require("../controllers/UserControllers/rewardstatus");
const {
  redeemMiles,
  markRewardAsUsed,
  listRewardsGrouped,
  listRewards,
} = require("../controllers/UserControllers/redeemController");

router.post("/earn", async (requestAnimationFrame, res) => {
  try {
    const { userId, amount } = requestAnimationFrame.body;
    await addNileMilesOnPurchase(userId, amount);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/redeem", redeemMiles);
router.get("/nilemiles/status", getNileMilesStatus);
router.post("/mark-reward-used", markRewardAsUsed);
router.get("/:userId/rewards", getReferralRewards);
router.get("/nilemiles/rewards/grouped", listRewardsGrouped);
router.get("/nilemiles/rewards", listRewards);

module.exports = router;
