const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const generateAuthTokens = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7days" });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

module.exports = { generateAuthTokens, generateRefreshToken };
