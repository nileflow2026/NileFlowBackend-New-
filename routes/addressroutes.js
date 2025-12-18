const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const {
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
} = require("../controllers/UserControllers/addressController");
const router = express.Router();

router.get("/addresses", authenticateToken, getAddresses);

// POST /api/addresses - Add a new address for the logged-in user
router.post("/add/address", authenticateToken, addAddress);

// PUT /api/addresses/:addressId - Update a specific address by its ID
router.put("/addresses/:addressId", authenticateToken, updateAddress);

// DELETE /api/addresses/:addressId - Delete a specific address by its ID
router.delete("/addresses/:addressId", authenticateToken, deleteAddress);

module.exports = router;
