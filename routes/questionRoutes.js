const express = require("express");
const {
  storeQuestion,
} = require("../controllers/AdminControllers/questionController");

const router = express.Router();

router.post("/askedquestions", storeQuestion);

module.exports = router;
