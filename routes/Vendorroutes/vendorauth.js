// routes/auth.js
const express = require("express");
const router = express.Router();
const authController = require("../../controllers/VendorControllers/vendorauthController");
const authenticateToken = require("../../middleware/authMiddleware");
const {
  loginSchema,
  validationSchemas,
} = require("../../utils/Vendor/validationSchemas");
const { validate } = require("../../middleware/Vendormiddleware/validation");

router.post("/register", authController.registerVendor);
router.post("/login", authController.loginVendor);
router.get("/me", authenticateToken, authController.getCurrentVendor);
router.post("/refresh", authController.handleRefreshToken);
router.post("/logout", authenticateToken, authController.logoutVendor);

module.exports = router;
/*   validate(validationSchemas.registerSchema), */
