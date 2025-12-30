const express = require("express");
const router = express.Router();
const {
  fetchAdminNotifications,
  clearAllNotifications,
  markNotificationsAsRead,
} = require("../controllers/AdminControllers/notificationController");
const authenticateToken = require("../middleware/authMiddleware");
const {
  fetchCustomerNotification,
  createNotification,
  markAllNotificationsAsRead,
} = require("../controllers/UserControllers/Clientnotification");

// Protected route
router.get(
  "/customernotification",
  authenticateToken,
  fetchCustomerNotification
);
router.post("/createnotification", authenticateToken, createNotification);

router.post("/mark-read", authenticateToken, markAllNotificationsAsRead);
/* router.get('/admin', authenticateToken, fetchAdminNotifications);
router.post('/clear',  authenticateToken, clearAllNotifications);
router.post('/mark-as-read',  authenticateToken, markNotificationsAsRead) */
module.exports = router;
