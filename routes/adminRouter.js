// routes/admin.js
const express = require("express");
const {
  getOrders,
  getProducts,
  updateOrderStatus,
  addProduct,
  getProductReviews,
  clientmesseags,
  replyclientmessages,
  addFeaturedProducts,
  addProductsDeal,
  updateProduct,
  getSubcategoriesByCategoryId,
  createSubcategory,
  getProductsBySubcategoryId,
  addFlashSale,
  getFlashSales,
  addReward,
  updateReward,
  deleteReward,
  listRewards,
  getApprovedProducts,
  getRejectedProducts,
  getSingleProductDetails,
  assignDeliveryToRider,
  getCancelledOrders,
  updatePremiumDeal,
} = require("../controllers/AdminControllers/admin");
const authenticateToken = require("../middleware/authMiddleware");
const {
  getPendingProducts,
  approveProduct,
  rejectProduct,
} = require("../controllers/AdminControllers/ProductapprovalController");
const router = express.Router();

router.get("/orders", authenticateToken, getOrders);
router.get("/orders/cancelled", authenticateToken, getCancelledOrders);
router.get("/products", authenticateToken, getProducts);
router.post("/orderStatus", authenticateToken, updateOrderStatus);
router.post("/addproducts", authenticateToken, addProduct);
router.put("/updateproducts", authenticateToken, updateProduct);
router.get("/messages", authenticateToken, clientmesseags);
router.post("/contact/reply", authenticateToken, replyclientmessages);
router.post("/products/feature", authenticateToken, addFeaturedProducts);
router.post("/products/deal", authenticateToken, addProductsDeal);
router.put("/premium-deal", authenticateToken, updatePremiumDeal);
router.post("/products/addReward", authenticateToken, addReward);
router.post("/products/updatereward", authenticateToken, updateReward);
router.post("/products/deletereward", authenticateToken, deleteReward);
router.post("/products/listrewards", authenticateToken, listRewards);
router.post("/products/flashsale", authenticateToken, addFlashSale);
// A new route for fetching flash sales
router.get("/products/flashsale", authenticateToken, getFlashSales);
// GET all subcategories under a specific category
router.get("/categories/:id/subcategories", getSubcategoriesByCategoryId);
router.get(
  "/products/subcategory/:id",
  authenticateToken,
  getProductsBySubcategoryId
);
// POST a new subcategory under a specific category
router.post("/:id/subcategories", authenticateToken, createSubcategory);

// Import product approval controller
router.get("/products/pending", authenticateToken, getPendingProducts);
router.get(
  "/products/pending/:productId",
  authenticateToken,
  getPendingProducts
);
router.post("/products/approve/:productId", authenticateToken, approveProduct);
router.post("/products/reject/:productId", authenticateToken, rejectProduct);
router.get("/products/pending", authenticateToken, getPendingProducts);
router.get("/products/approved", authenticateToken, getApprovedProducts);
router.get("/products/rejected", authenticateToken, getRejectedProducts);
router.get("/products/:productId", authenticateToken, getSingleProductDetails);
router.post("/assign-delivery", authenticateToken, assignDeliveryToRider);

router.get("/products/:productId/stock", async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      productId
    );

    res.json({
      productId,
      stock: product.stock || 0,
      available: (product.stock || 0) > 0,
      productName: product.productName,
      isApproved: product.isApproved,
      isActive: product.isActive,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to check stock",
      details: error.message,
    });
  }
});

module.exports = router;
