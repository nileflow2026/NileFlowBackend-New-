// middleware/authMiddleware.js
const { verifyAccessToken } = require("../utils/tokenManager");

const authMiddleware = async (req, res, next) => {
  try {
    console.log(`🔐 Auth middleware called for: ${req.method} ${req.path}`);
    console.log(`🌐 Origin: ${req.headers.origin}`);
    console.log(`🍪 Cookies received:`, Object.keys(req.cookies || {}));

    // Set CORS headers first, especially for cross-origin routes
    const origin = req.headers.origin;
    if (
      origin &&
      (origin.includes("admin.nileflowafrica.com") ||
        origin.includes("vendor.nileflowafrica.com") ||
        origin.includes("nileflowafrica.com") ||
        origin.includes("localhost"))
    ) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
      res.header(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type,Authorization,X-Requested-With,Accept,X-CSRF-Token,Cache-Control,Pragma",
      );
      console.log(`🔐 Auth middleware: CORS headers set for ${origin}`);
    }

    // Get token from cookie
    const accessToken = req.cookies?.accessToken;

    console.log(`🔍 Access token present: ${accessToken ? "YES" : "NO"}`);
    if (accessToken) {
      console.log(`🔍 Token length: ${accessToken.length}`);
      console.log(`🔍 Token starts with: ${accessToken.substring(0, 20)}...`);
    }

    if (!accessToken) {
      console.log("❌ Auth middleware: No access token provided");
      console.log("❌ Available cookies:", req.cookies);
      return res.status(401).json({
        error: "No access token provided",
        debug: {
          cookiesReceived: Object.keys(req.cookies || {}),
          origin: req.headers.origin,
          path: req.path,
        },
      });
    }

    console.log("🔑 Verifying token...");

    // Verify token
    const decoded = verifyAccessToken(accessToken);
    console.log("✅ Token verified successfully");

    // Attach user info to request
    req.user = {
      userId: decoded.sub,
      role: decoded.role,
      email: decoded.email || null,
    };

    console.log("✅ Auth middleware complete for user:", req.user.userId);

    next();
  } catch (error) {
    console.log("❌ Auth middleware error:", error.message);

    // Ensure CORS headers are set even on error
    const origin = req.headers.origin;
    if (
      origin &&
      (origin.includes("admin.nileflowafrica.com") ||
        origin.includes("vendor.nileflowafrica.com") ||
        origin.includes("nileflowafrica.com") ||
        origin.includes("localhost"))
    ) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
      console.log(`🔐 Auth error: CORS headers set for ${origin}`);
    }

    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
