const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    symbol: { type: String, required: true, uppercase: true },
    companyName: { type: String, default: '' },
    type: { type: String, enum: ['BUY', 'SELL'], required: true },
    quantity: { type: Number, required: true, min: 1 },
    pricePerShare: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    // For SELL trades — profit/loss calculation
    averageBuyPrice: { type: Number, default: 0 },
    pnl: { type: Number, default: 0 },
    pnlPercent: { type: Number, default: 0 },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    executedAt: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

// Index for fast user-based queries sorted by time
tradeSchema.index({ user: 1, executedAt: -1 });
tradeSchema.index({ user: 1, symbol: 1 });

module.exports = mongoose.model('Trade', tradeSchema);
