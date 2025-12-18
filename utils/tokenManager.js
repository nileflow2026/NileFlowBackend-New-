// lib/tokenManager.js
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { env } = require("../src/env");

/**
 * Token manager: signs/verifies tokens and hashes refresh tokens.
 * Keep token logic isolated for easier rotation and testing.
 */

// Secrets must come from env. Throw early if missing.
if (!env.JWT_SECRET || !env.JWT_REFRESH_SECRET) {
  throw new Error(
    "Missing JWT secrets in env (JWT_SECRET / JWT_REFRESH_SECRET)."
  );
}

const ACCESS_SECRET = env.JWT_SECRET;
const REFRESH_SECRET = env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES = env.JWT_EXPIRES_IN || "15m";
const REFRESH_EXPIRES = env.JWT_REFRESH_EXPIRES_IN || "30d";

/**
 * Sign access token (short lived). Payload should be minimal: { sub: userId, role }
 * @param {object} payload
 * @returns {string} jwt
 */
function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
    jwtid: crypto.randomUUID(),
  });
}

/**
 * Sign refresh token (long lived). Keep payload small: { sub: userId }
 * @param {object} payload
 * @returns {string} jwt
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
    jwtid: crypto.randomUUID(),
  });
}

/**
 * Verify access token signature. Throws on invalid/expired.
 * @param {string} token
 * @returns {object} decoded
 */
function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

/**
 * Verify refresh token signature. Throws on invalid/expired.
 * @param {string} token
 * @returns {object} decoded
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

/**
 * Hash a token using SHA256 and return hex string.
 * @param {string} token
 * @returns {string}
 */
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Convert simple timeframe strings to ms. Supports: {s,m,h,d} e.g. "15m", "30d"
 * Returns 0 if format not recognized.
 * @param {string} t
 * @returns {number}
 */
function timeframeToMs(t) {
  if (!t || typeof t !== "string") return 0;
  const m = String(t).match(/^(\d+)([smhd])$/);
  if (!m) return 0;
  const n = Number(m[1]);
  switch (m[2]) {
    case "s":
      return n * 1000;
    case "m":
      return n * 60 * 1000;
    case "h":
      return n * 60 * 60 * 1000;
    case "d":
      return n * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken, // ADD THIS
  verifyRefreshToken,
  hashToken,
  timeframeToMs,
  ACCESS_EXPIRES,
  REFRESH_EXPIRES,
};
