const express = require("express");
const router = express.Router();
const {
  createStaff,
  updateStaff,
  deleteStaff,
  getStaff,
} = require("../controllers/AdminControllers/staffcontroller");
const authenticateToken = require("../middleware/authMiddleware");

router.post("/createStaff", authenticateToken, createStaff);
router.post("/updateStaff", authenticateToken, updateStaff);
router.post("/deleteStaff", authenticateToken, deleteStaff);
router.get("/getStaff", authenticateToken, getStaff);

module.exports = router;
