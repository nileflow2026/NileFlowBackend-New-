// routes/cartRoutes.js
const express = require("express");
const { applyPremiumBenefits } = require("../middleware/premiumMiddleware");
const {
  addToCart,
  fetchCart,
  removeFromCart,
  updateQuantity,
  loadCart,
  validateCartStock,
  clearCartAfterOrder,
} = require("../controllers/UserControllers/cartController");

const router = express.Router();

// Apply premium middleware only to POST/PUT requests that have cart data
router.post("/add", applyPremiumBenefits, addToCart);
router.post("/validate-stock", applyPremiumBenefits, validateCartStock);
router.get("/fetch/:userId", fetchCart); // Remove middleware from GET requests
router.get("/load/:userId", loadCart); // Remove middleware from GET requests
router.put("/update/:cartItemId", applyPremiumBenefits, updateQuantity);
router.delete("/remove/:cartItemId", removeFromCart);
router.delete("/clear/:userId", clearCartAfterOrder);

module.exports = router;
