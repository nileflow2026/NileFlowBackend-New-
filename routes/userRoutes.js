const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const {
  getAdminProfile,
  getUsers,
} = require("../controllers/AdminControllers/userController");
const {
  getAuditLogs,
} = require("../controllers/AdminControllers/auditLoggerController");

// Protected route
router.get("/admin/profile", authenticateToken, getAdminProfile);
router.get("/audit-logs", getAuditLogs);
router.get("/users", getUsers);

module.exports = router;
