// middleware/authMiddleware.js
const { verifyAccessToken } = require("../utils/tokenManager");

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from cookie
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        error: "No access token provided",
      });
    }

    /* console.log("Verifying token..."); */

    // Verify token
    const decoded = verifyAccessToken(accessToken);
    /*     console.log("✅ Token verified successfully");
    console.log("Decoded token content:", JSON.stringify(decoded, null, 2));

    // Check what fields are available
    console.log("Available token fields:", Object.keys(decoded)); */

    // Attach user info to request
    req.user = {
      userId: decoded.sub,
      role: decoded.role,
    };

    /* console.log("Set req.user:", req.user);
    console.log("=== AUTH MIDDLEWARE COMPLETE ==="); */

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
