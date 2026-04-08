const express = require("express");
const {
  newsletter,
  sendnewsletter,
  getAudienceStatistics,
  getCampaignTypes,
} = require("../controllers/AdminControllers/newsletterController");
const {
  usercheck,
} = require("../controllers/AdminControllers/usercheckController");
const router = express.Router();

router.post("/subscribe", newsletter);
router.post("/send-newsletter", sendnewsletter);
router.get("/audience-statistics", getAudienceStatistics);
router.get("/campaign-types", getCampaignTypes);
router.post("/user-check", usercheck);


module.exports = router;
