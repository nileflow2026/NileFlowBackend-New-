const express = require("express");
const {
  getSettingsDoc,
  updateSettingDoc,
} = require("../services/settingsService");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");

router.get("/getsettings", authenticateToken, getSettingsDoc);
router.post("/updatesettings", authenticateToken, updateSettingDoc);

module.exports = router;
