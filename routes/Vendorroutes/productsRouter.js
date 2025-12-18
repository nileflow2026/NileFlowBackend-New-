// routes/products.js
const express = require("express");
const router = express.Router();
const productController = require("../../controllers/VendorControllers/productController");
const authenticateToken = require("../../middleware/authMiddleware");
const { validate } = require("../../middleware/Vendormiddleware/validation");
const { validationSchemas } = require("../../utils/Vendor/validationSchemas");

// --- STATIC ROUTES FIRST ---
router.post("/addproduct", authenticateToken, productController.createProduct);
router.get(
  "/vendorproducts",
  authenticateToken,
  productController.getVendorProducts
);

// --- DYNAMIC ROUTES LAST ---
router.get(
  "/product/:productId",
  authenticateToken,
  productController.getProduct
);
router.patch(
  "/product/:productId",
  validate(validationSchemas.updateProductSchema),
  authenticateToken,
  productController.updateProduct
);
router.delete(
  "/product/:productId",
  authenticateToken,
  productController.deleteProduct
);
router.post(
  "/product/upload-direct",
  authenticateToken,
  productController.uploadDirect
);
router.post(
  "/upload-image",
  authenticateToken,
  productController.uploadProductImage
);

// Batch upload route (if you want to upload multiple images at once)
router.post(
  "/product/upload-batch",
  authenticateToken,
  productController.uploadBatch
);

module.exports = router;
