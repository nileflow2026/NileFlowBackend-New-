// routes/cartRoutes.js
const express = require("express");
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

router.post("/add", addToCart);
router.post("/validate-stock", validateCartStock);
router.get("/fetch/:userId", fetchCart);
router.get("/load/:userId", loadCart);
router.put("/update/:cartItemId", updateQuantity);
router.delete("/remove/:cartItemId", removeFromCart);
router.delete("/clear/:userId", clearCartAfterOrder);

module.exports = router;
