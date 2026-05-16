const express = require('express');
const { searchStocks, getStockQuote, getStockCandles, getMarketStatus } = require('../controllers/stockController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/search', searchStocks);
router.get('/market-status', getMarketStatus);
router.get('/quote/:symbol', getStockQuote);
router.get('/candles/:symbol', getStockCandles);

module.exports = router;
