// middleware/authMiddleware.js

const { verifyAccessToken } = require("../../utils/tokenManager");

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from cookie
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res.status(401).json({ error: "No access token provided" });
    }

    // Verify token
    const decoded = verifyAccessToken(accessToken);

    // Attach user info to request
    req.user = {
      userId: decoded.sub,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
