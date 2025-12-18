const express = require("express");
const clientmessages = require("../controllers/UserControllers/clientmessages");
const router = express.Router();

router.post("/contact", clientmessages);

module.exports = router;
