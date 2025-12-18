// routes/applyRoutes.js
const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload"); // Import the multer middleware
const {
  submitApplication,
  getApplications,
} = require("../controllers/UserControllers/applyController");

// Use `upload.single` to handle a single file upload with the field name 'cv'
router.post("/submit", upload.single("cv"), submitApplication);
router.get("/get-applications", getApplications); // New GET route to fetch all applications

module.exports = router;
