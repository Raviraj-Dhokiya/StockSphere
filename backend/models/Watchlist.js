const mongoose = require('mongoose');

const watchlistItemSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const watchlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    stocks: {
      type: [watchlistItemSchema],
      default: [],
      validate: {
        validator: function (stocks) {
          return stocks.length <= 20;
        },
        message: 'Watchlist cannot exceed 20 stocks',
      },
    },
  },
  { timestamps: true }
);

// Prevent duplicate symbols
watchlistSchema.methods.hasSymbol = function (symbol) {
  return this.stocks.some((s) => s.symbol === symbol.toUpperCase());
};

module.exports = mongoose.model('Watchlist', watchlistSchema);
