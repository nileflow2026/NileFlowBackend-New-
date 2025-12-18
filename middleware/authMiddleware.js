// middleware/authMiddleware.js
const { verifyAccessToken } = require("../utils/tokenManager");

const authMiddleware = async (req, res, next) => {
  try {
    /* console.log("=== AUTH MIDDLEWARE EXECUTING ===");
    console.log("Request URL:", req.originalUrl);
    console.log("Request method:", req.method);
    console.log("Cookies received:", req.cookies); */

    /*  console.log("\n=== AUTH MIDDLEWARE STARTED ===");
    console.log("Time:", new Date().toISOString());
    console.log("Request URL:", req.originalUrl);
    console.log("Request Method:", req.method);
    console.log("Full Headers:", req.headers);
    console.log("Raw Cookies String:", req.headers.cookie);
    console.log("Parsed Cookies:", req.cookies); */

    // Get token from cookie
    const accessToken = req.cookies?.accessToken;
    /* console.log(
      "Access Token from cookie:",
      accessToken ? `Present (${accessToken.substring(0, 20)}...)` : "MISSING"
    ); */

    if (!accessToken) {
      console.error("❌ ERROR: No access token in cookies");
      console.log("All cookies available:", Object.keys(req.cookies || {}));
      return res.status(401).json({
        error: "No access token provided",
        debug: { cookies: req.cookies },
      });
    }

    /* console.log("Verifying token..."); */

    // Verify token
    const decoded = verifyAccessToken(accessToken);
    /*     console.log("✅ Token verified successfully");
    console.log("Decoded token content:", JSON.stringify(decoded, null, 2));

    // Check what fields are available
    console.log("Available token fields:", Object.keys(decoded)); */
    // Get token from cookie
    /* const accessToken = req.cookies.accessToken; */

    if (!accessToken) {
      return res.status(401).json({ error: "No access token provided" });
    }

    // Verify token
    /*  const decoded = verifyAccessToken(accessToken); */

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
