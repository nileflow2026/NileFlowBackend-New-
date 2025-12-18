// routes/careersRoutes.js
const express = require("express");
const { getCareers, addCareer } = require("../controllers/AdminControllers/careersController");
const router = express.Router();

router.get("/", getCareers);
router.post("/add", addCareer); // You should add admin authentication middleware here

module.exports = router;
