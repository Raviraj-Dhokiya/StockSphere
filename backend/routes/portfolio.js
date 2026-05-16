const express = require('express');
const { protect } = require('../middleware/auth');
const { getPortfolio, buyStock, sellStock, getTrades } = require('../controllers/portfolioController');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/', getPortfolio);
router.post('/buy', buyStock);
router.post('/sell', sellStock);
router.get('/trades', getTrades);

module.exports = router;
