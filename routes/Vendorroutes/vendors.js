// routes/vendors.js
const express = require("express");
const router = express.Router();
const vendorController = require("../../controllers/VendorControllers/vendorController");
const authenticateToken = require("../../middleware/authMiddleware");
const multer = require("multer");

// Use memory storage for Appwrite uploads
// Simple multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  // Remove fileFilter for now to test
});

// Error handling wrapper for multer
const handleUpload = (uploadMethod) => {
  return (req, res, next) => {
    uploadMethod(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            error: "File too large. Maximum size is 5MB.",
          });
        }
        return res.status(400).json({
          success: false,
          error: "File upload error: " + err.message,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          error: err.message,
        });
      }
      next();
    });
  };
};

// Routes
// In your vendor routes file
// In your vendor routes file - FIXED VERSION
// SIMPLE WORKING VERSION - remove all debugging first
// In your vendor routes file - FIXED VERSION
router.put(
  "/profile-picture",
  authenticateToken,
  (req, res, next) => {
    console.log("=== PROFILE PICTURE UPLOAD DEBUG ===");
    console.log("Headers:", req.headers);
    console.log("Content-Type:", req.headers["content-type"]);
    console.log(
      "Authorization header present:",
      !!req.headers["authorization"]
    );
    console.log("Request body available:", !!req.body); // Don't use Object.keys on potentially undefined

    upload.single("avatar")(req, res, (err) => {
      console.log("=== MULTER PROCESSING COMPLETE ===");
      console.log("Multer error:", err);
      console.log(
        "Request file:",
        req.file
          ? {
              originalname: req.file.originalname,
              mimetype: req.file.mimetype,
              size: req.file.size,
              buffer: req.file.buffer
                ? `Buffer(${req.file.buffer.length} bytes)`
                : "No buffer",
            }
          : "No file"
      );

      if (err instanceof multer.MulterError) {
        console.log("MulterError code:", err.code);
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            error: "File too large. Maximum size is 5MB.",
          });
        }
        return res.status(400).json({
          success: false,
          error: "File upload error: " + err.message,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          error: err.message,
        });
      }

      // Check if file was actually received
      if (!req.file) {
        console.log("No file received by multer");
        return res.status(400).json({
          success: false,
          error: "No file uploaded or file format not supported",
        });
      }

      console.log("File successfully received, proceeding to controller...");
      next();
    });
  },
  vendorController.updateProfilePicture
);

router.delete(
  "/profile-picture",
  authenticateToken,
  vendorController.removeProfilePicture
);
router.patch("/profile", authenticateToken, vendorController.updateProfile);
router.get(
  "/dashboard/stats",
  authenticateToken,
  vendorController.getDashboardStats
);

module.exports = router;
