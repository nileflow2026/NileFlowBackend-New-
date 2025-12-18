// routes/promotionRoutes.js
const express = require('express');
const { getTodayPromo } = require('../controllers/AdminControllers/promoController');
const router = express.Router();



// GET /api/promotion
router.get('/promotion', getTodayPromo);

module.exports = router;
