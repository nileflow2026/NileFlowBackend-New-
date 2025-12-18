const express = require("express");
const {
  newsletter,
  sendnewsletter,
} = require("../controllers/AdminControllers/newsletterController");
const {
  usercheck,
} = require("../controllers/AdminControllers/usercheckController");
const router = express.Router();

router.post("/subscribe", newsletter);
router.post("/send-newsletter", sendnewsletter);
router.post("/user-check", usercheck);

module.exports = router;
