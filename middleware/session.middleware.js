// middleware/session.middleware.js

const AppwriteSessionService = require("../services/AppwriteSessionService");

const validateSession = async (req, res, next) => {
  const sessionId = req.cookies.session_id;
  const csrfToken = req.headers["x-csrf-token"] || req.body._csrf;

  if (!sessionId) {
    return res.status(401).json({
      error: "No active session",
      code: "SESSION_REQUIRED",
    });
  }

  try {
    // Validate session with Appwrite
    const { session, user, metadata } =
      await AppwriteSessionService.validateSession(sessionId, csrfToken);

    // Check if session needs rotation (every 24 hours)
    const sessionAge = Date.now() - new Date(metadata.createdAt).getTime();
    if (sessionAge > 24 * 60 * 60 * 1000) {
      // Flag for recommended re-authentication
      req.sessionNeedsRefresh = true;
    }

    // Attach user and session to request
    req.user = {
      id: user.$id,
      // Provide `userId` alias used across the codebase
      userId: user.$id,
      email: user.email,
      username: user.name,
      role: user.prefs?.role || "customer",
      metadata: user.prefs || {},
    };

    req.session = {
      id: sessionId,
      csrfToken: metadata.csrfToken,
      expiresAt: session.expire,
    };

    // Update last activity (sessionService not defined in this module); skip if unavailable

    next();
  } catch (error) {
    // Clear invalid session cookies
    res.clearCookie("session_id");
    res.clearCookie("csrf_token");

    return res.status(401).json({
      error: "Session invalid or expired",
      code: "SESSION_INVALID",
      action: "REAUTHENTICATE_REQUIRED",
    });
  }
};

// CSRF protection middleware
const csrfProtection = (req, res, next) => {
  // Skip CSRF for safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const csrfToken = req.headers["x-csrf-token"] || req.body._csrf;

  if (!csrfToken || csrfToken !== req.session?.csrfToken) {
    return res.status(403).json({
      error: "Invalid CSRF token",
      code: "CSRF_TOKEN_INVALID",
    });
  }

  next();
};
module.exports = {
  validateSession,
  csrfProtection,
};
