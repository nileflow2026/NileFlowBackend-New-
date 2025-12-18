const express = require("express");
module.exports = express.Router().get("/health", (_req, res) => res.json({ status: "ok" }));
