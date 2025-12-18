const express = require("express");
const {
  getProducts,
} = require("../controllers/AdminControllers/productscontroller");
const router = express.Router();

router.get("/:id", getProducts);

module.exports = router;
