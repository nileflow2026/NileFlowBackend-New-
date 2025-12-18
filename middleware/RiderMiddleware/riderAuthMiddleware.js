// middleware/riderAuthMiddleware.js
const { verifyAccessToken } = require("../../utils/tokenManager");

const riderAuthMiddleware = async (req, res, next) => {
  try {
    // Get token from cookie
    const accessToken = req.cookies.accessToken;

    console.log(
      "🔐 Rider Auth Middleware - Token:",
      accessToken ? "Present" : "Missing"
    );

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: "No access token provided",
      });
    }

    // Verify token
    const decoded = verifyAccessToken(accessToken);

    // Verify it's a rider token
    if (decoded.role !== "rider") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Rider access required.",
      });
    }

    console.log("✅ Rider token verified for:", decoded.sub);

    // Attach rider info to request
    req.rider = {
      riderId: decoded.sub,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.log("❌ Rider auth middleware error:", error.message);
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};

module.exports = riderAuthMiddleware;
