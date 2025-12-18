// verifyJWT.js middleware
const jwt = require("jsonwebtoken");
const { env } = require("../src/env");

module.exports = function verifyJWT(req, res, next) {
  try {
    const auth = req.headers["authorization"] || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Missing auth token" });
    }

    // Verify token using configured secret
    const payload = jwt.verify(token, env.JWT_SECRET || process.env.JWT_SECRET);

    req.user = {
      id: payload.sub,
      // Provide legacy `userId` alias used across controllers
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      ...payload,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
