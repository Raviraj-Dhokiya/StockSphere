const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema({
  symbol: { type: String, required: true, uppercase: true },
  companyName: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 0 },
  averageBuyPrice: { type: Number, required: true, min: 0 },
  totalInvested: { type: Number, required: true, min: 0 },
  currentPrice: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
});

// Virtual: unrealized P&L
holdingSchema.virtual('unrealizedPnL').get(function () {
  return (this.currentPrice - this.averageBuyPrice) * this.quantity;
});

// Virtual: P&L percent
holdingSchema.virtual('pnlPercent').get(function () {
  if (this.averageBuyPrice === 0) return 0;
  return ((this.currentPrice - this.averageBuyPrice) / this.averageBuyPrice) * 100;
});

// Virtual: current value
holdingSchema.virtual('currentValue').get(function () {
  return this.currentPrice * this.quantity;
});

const portfolioSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    holdings: [holdingSchema],
    totalInvested: { type: Number, default: 0 },
    totalCurrentValue: { type: Number, default: 0 },
    totalPnL: { type: Number, default: 0 },
    pnlPercent: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

module.exports = mongoose.model('Portfolio', portfolioSchema);
