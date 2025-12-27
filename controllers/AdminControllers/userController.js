const { Query } = require("node-appwrite");
const { users, db } = require("../../services/appwriteService");
const { env } = require("../../src/env");

// controllers/adminController.js

const getAdminProfile = async (req, res) => {
  try {
    // req.user is injected by your JWT middleware
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token." });
    }

    const { userId, email, username, role } = req.user;

    // Role check
    if (role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admins only." });
    }

    // Return normalized profile
    return res.status(200).json({
      userId,
      email,
      username,
      role,
    });
  } catch (err) {
    console.error("[AdminProfile] Error:", err);
    return res.status(500).json({ error: "Server error retrieving profile." });
  }
};

const getUsers = async (_req, res) => {
  try {
    const { documents } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID
    );
    res.json(documents);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = { getAdminProfile, getUsers };
