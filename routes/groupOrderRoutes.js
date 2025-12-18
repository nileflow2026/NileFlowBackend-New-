const express = require("express");
const router = express.Router();
const {
  createGroupOrder,
  listGroupOrders,
  getGroupOrder,
  updateGroupOrder,
  cancelGroupOrder,
  joinGroupOrder,
  leaveGroupOrder,
  expireGroupOrders,
} = require("../controllers/AdminControllers/groupOrderController");

// Define a POST route for creating a group order
router.post("/create", createGroupOrder);
router.post("/", createGroupOrder);
router.get("/", listGroupOrders);
router.get("/:id", getGroupOrder);
router.patch("/:id", updateGroupOrder); // admin or owner
router.delete("/:id", cancelGroupOrder);

router.post("/:id/join", joinGroupOrder);
router.post("/:id/leave", leaveGroupOrder);

// Endpoint to run by scheduler (cron/Appwrite functions) to expire orders
router.post("/expire-check", expireGroupOrders);

module.exports = router;
