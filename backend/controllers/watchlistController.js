const Watchlist = require('../models/Watchlist');

// @desc    Get user's watchlist
// @route   GET /api/watchlist
// @access  Private
const getWatchlist = async (req, res) => {
  try {
    let watchlist = await Watchlist.findOne({ user: req.user._id });
    if (!watchlist) {
      watchlist = await Watchlist.create({ user: req.user._id });
    }
    res.json({ success: true, stocks: watchlist.stocks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Add stock to watchlist
// @route   POST /api/watchlist
// @access  Private
const addToWatchlist = async (req, res) => {
  const { symbol, companyName } = req.body;

  if (!symbol || !companyName) {
    return res.status(400).json({ success: false, message: 'Symbol and company name are required.' });
  }

  try {
    let watchlist = await Watchlist.findOne({ user: req.user._id });
    if (!watchlist) {
      watchlist = await Watchlist.create({ user: req.user._id });
    }

    if (watchlist.hasSymbol(symbol)) {
      return res.status(400).json({ success: false, message: `${symbol.toUpperCase()} is already in your watchlist.` });
    }

    if (watchlist.stocks.length >= 20) {
      return res.status(400).json({ success: false, message: 'Watchlist is full (max 20 stocks).' });
    }

    watchlist.stocks.push({ symbol: symbol.toUpperCase(), companyName });
    await watchlist.save();

    res.status(201).json({
      success: true,
      message: `${symbol.toUpperCase()} added to watchlist.`,
      stocks: watchlist.stocks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Remove stock from watchlist
// @route   DELETE /api/watchlist/:symbol
// @access  Private
const removeFromWatchlist = async (req, res) => {
  const { symbol } = req.params;

  try {
    const watchlist = await Watchlist.findOne({ user: req.user._id });
    if (!watchlist) {
      return res.status(404).json({ success: false, message: 'Watchlist not found.' });
    }

    const initialLength = watchlist.stocks.length;
    watchlist.stocks = watchlist.stocks.filter(
      (s) => s.symbol !== symbol.toUpperCase()
    );

    if (watchlist.stocks.length === initialLength) {
      return res.status(404).json({ success: false, message: `${symbol.toUpperCase()} not found in watchlist.` });
    }

    await watchlist.save();

    res.json({
      success: true,
      message: `${symbol.toUpperCase()} removed from watchlist.`,
      stocks: watchlist.stocks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getWatchlist, addToWatchlist, removeFromWatchlist };
