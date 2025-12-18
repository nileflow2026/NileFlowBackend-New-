// tokens.js
const jwt = require("jsonwebtoken");

const ACCESS_EXPIRES = parseInt(process.env.JWT_SECRET || "900"); // seconds
const REFRESH_EXPIRES = parseInt(process.env.JWT_REFRESH_SECRET || "2592000");

const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  });
};

const generateRefreshToken = (payload) => {
  // include jti to help revoke
  const jti = require("crypto").randomBytes(16).toString("hex");
  return jwt.sign({ ...payload, jti }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  });
};

const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET);
const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  ACCESS_EXPIRES,
  REFRESH_EXPIRES,
};
