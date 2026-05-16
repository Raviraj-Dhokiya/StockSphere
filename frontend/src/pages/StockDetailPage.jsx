import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToWatchlist, removeFromWatchlist } from '../store/slices/watchlistSlice';
import { buyStock, sellStock } from '../store/slices/portfolioSlice';
import { fetchStockQuote, updateStockPrice } from '../store/slices/stocksSlice';
import StockChart from '../components/StockChart';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

const StockDetailPage = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { stocks } = useSelector((state) => state.watchlist);
  const { quotes, loading: stocksLoading } = useSelector((state) => state.stocks);
  const { tradeLoading } = useSelector((state) => state.portfolio);
  const { user } = useSelector((state) => state.auth);

  const stock = symbol ? quotes[symbol.toUpperCase()] : null;
  const loading = symbol ? !!stocksLoading[symbol.toUpperCase()] : false;
  const [error, setError] = useState(null);

  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [tradeType, setTradeType] = useState('BUY');
  const [quantity, setQuantity] = useState(1);

  // Portfolio holding for this symbol
  const { data: portfolio } = useSelector((state) => state.portfolio);
  const holding = portfolio?.holdings?.find(
    (h) => h.symbol === symbol?.toUpperCase()
  );

  const isInWatchlist = stocks.some((s) => s.symbol === symbol?.toUpperCase());

  // Fetch quote
  useEffect(() => {
    if (symbol) {
      setError(null);
      dispatch(fetchStockQuote(symbol)).then((result) => {
        if (fetchStockQuote.rejected.match(result)) {
          setError(result.payload || 'Failed to load stock data');
        }
      });
    }
  }, [symbol, dispatch]);

  // Socket for live price updates
  useEffect(() => {
    if (!symbol) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    socket.emit('join_stock', symbol.toUpperCase());

    const handlePriceUpdate = (data) => {
      if (data.symbol === symbol.toUpperCase()) {
        dispatch(updateStockPrice(data));
      }
    };

    socket.on('stock_price_update', handlePriceUpdate);

    return () => {
      socket.emit('leave_stock', symbol.toUpperCase());
      socket.off('stock_price_update', handlePriceUpdate);
      socket.disconnect();
    };
  }, [symbol, dispatch]);

  const handleWatchlist = async () => {
    if (isInWatchlist) {
      const result = await dispatch(removeFromWatchlist(symbol));
      if (removeFromWatchlist.fulfilled.match(result)) toast.success(`Removed ${symbol} from watchlist`);
    } else {
      const result = await dispatch(addToWatchlist({ symbol, companyName: stock?.companyName || symbol }));
      if (addToWatchlist.fulfilled.match(result)) toast.success(`Added ${symbol} to watchlist ⭐`);
      else toast.error(result.payload || 'Failed to add to watchlist');
    }
  };

  const handleTrade = async (e) => {
    e.preventDefault();
    const qty = Number(quantity);
    if (!qty || qty <= 0) return toast.error('Enter a valid quantity');

    if (tradeType === 'BUY') {
      const cost = stock.currentPrice * qty;
      if (cost > (user?.portfolioBalance || 0)) {
        return toast.error(`Insufficient balance. Need $${cost.toFixed(2)}`);
      }
      const result = await dispatch(buyStock({
        symbol: stock.symbol,
        companyName: stock.companyName,
        quantity: qty,
        pricePerShare: stock.currentPrice,
      }));
      if (buyStock.fulfilled.match(result)) {
        toast.success(`✅ Bought ${qty} shares of ${stock.symbol}`);
        setTradeModalOpen(false);
        setQuantity(1);
      } else {
        toast.error(result.payload || 'Failed to buy stock');
      }
    } else {
      if (!holding || holding.quantity < qty) {
        return toast.error(`You only own ${holding?.quantity || 0} shares`);
      }
      const result = await dispatch(sellStock({
        symbol: stock.symbol,
        quantity: qty,
        pricePerShare: stock.currentPrice,
      }));
      if (sellStock.fulfilled.match(result)) {
        toast.success(`✅ Sold ${qty} shares of ${stock.symbol}`);
        setTradeModalOpen(false);
        setQuantity(1);
      } else {
        toast.error(result.payload || 'Failed to sell stock');
      }
    }
  };

  const openTradeModal = (type) => {
    setTradeType(type);
    setTradeModalOpen(true);
    setQuantity(1);
  };

  const formatMarketCap = (val) => {
    if (!val) return 'N/A';
    if (val >= 1000) return `$${(val / 1000).toFixed(2)}T`;
    return `$${val.toFixed(2)}B`;
  };

  if (loading && !stock) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="card p-6 space-y-4">
          <div className="skeleton h-10 w-72 rounded-xl" />
          <div className="skeleton h-6 w-48 rounded-xl" />
        </div>
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    );
  }

  if (error && !stock) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-accent-red-dim rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-accent-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="font-display font-bold text-xl text-white mb-2">Stock Not Found</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
        </div>
      </div>
    );
  }

  const isPositive = (stock?.change || 0) >= 0;
  const estimatedTotal = (stock?.currentPrice || 0) * quantity;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-sm">Back</span>
      </button>

      {/* Stock header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {stock?.logo && (
                <img
                  src={stock.logo}
                  alt={stock.companyName}
                  className="w-10 h-10 rounded-xl object-contain bg-white p-1"
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
              <div>
                <h1 className="font-display font-bold text-2xl text-white">{stock?.companyName || symbol?.toUpperCase()}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-sm text-gray-400">{stock?.symbol || symbol?.toUpperCase()}</span>
                  {stock?.exchange && <span className="text-gray-600 text-xs">· {stock.exchange}</span>}
                  {stock?.industry && <span className="text-gray-600 text-xs">· {stock.industry}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-baseline gap-4 mt-4">
              <span className="font-display font-bold text-4xl text-white font-mono">
                ${stock?.currentPrice?.toFixed(2) || '—'}
              </span>
              <div className={`flex items-center gap-1 ${isPositive ? 'badge-green' : 'badge-red'}`}>
                <span>{isPositive ? '▲' : '▼'}</span>
                <span>{Math.abs(stock?.change || 0).toFixed(2)} ({Math.abs(stock?.changePercent || 0).toFixed(2)}%)</span>
              </div>
              {/* Live indicator */}
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
                <span className="text-xs text-gray-500 font-mono">LIVE</span>
              </div>
            </div>

            {/* Holding info */}
            {holding && (
              <div className="mt-3 inline-flex items-center gap-2 bg-accent-green-dim px-3 py-1.5 rounded-lg">
                <svg className="w-4 h-4 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-accent-green text-xs font-medium font-mono">
                  You own {holding.quantity} share{holding.quantity !== 1 ? 's' : ''} @ avg ${holding.averageBuyPrice?.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleWatchlist}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-medium text-sm transition-all duration-200 ${
              isInWatchlist
                ? 'border-accent-green/40 bg-accent-green-dim text-accent-green hover:bg-accent-red-dim hover:border-accent-red/40 hover:text-accent-red'
                : 'border-surface-border bg-surface text-gray-300 hover:border-accent-green/40 hover:text-accent-green'
            }`}
          >
            <svg className="w-4 h-4" fill={isInWatchlist ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            {isInWatchlist ? 'Watchlisted' : 'Add to Watchlist'}
          </button>
        </div>

        {/* Trade Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={() => openTradeModal('BUY')}
            className="flex-1 bg-accent-green text-dark-900 font-bold py-3 rounded-xl hover:bg-opacity-90 transition-all active:scale-98"
          >
            Buy {stock?.symbol || symbol?.toUpperCase()}
          </button>
          <button
            onClick={() => openTradeModal('SELL')}
            disabled={!holding}
            className="flex-1 bg-surface border border-surface-border text-white font-bold py-3 rounded-xl hover:bg-dark-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title={!holding ? 'You don\'t own this stock' : 'Sell'}
          >
            Sell {stock?.symbol || symbol?.toUpperCase()}
            {holding && <span className="ml-2 text-xs text-gray-400">({holding.quantity} shares)</span>}
          </button>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-surface-border">
          {[
            { label: 'Open', value: stock?.openPrice ? `$${stock.openPrice.toFixed(2)}` : 'N/A' },
            { label: 'Prev Close', value: stock?.previousClose ? `$${stock.previousClose.toFixed(2)}` : 'N/A' },
            { label: 'Day High', value: stock?.highPrice ? `$${stock.highPrice.toFixed(2)}` : 'N/A' },
            { label: 'Day Low', value: stock?.lowPrice ? `$${stock.lowPrice.toFixed(2)}` : 'N/A' },
          ].map((stat) => (
            <div key={stat.label} className="bg-dark-800 rounded-xl px-4 py-3">
              <p className="text-gray-500 text-xs mb-1">{stat.label}</p>
              <p className="font-mono font-semibold text-white text-sm">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <StockChart symbol={symbol?.toUpperCase()} />

      {/* Additional info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-display font-semibold text-white mb-4">Company Details</h3>
          <div className="space-y-3">
            {[
              { label: 'Market Cap', value: formatMarketCap(stock?.marketCap) },
              { label: 'Industry', value: stock?.industry || 'N/A' },
              { label: 'Exchange', value: stock?.exchange || 'N/A' },
              { label: 'Currency', value: stock?.currency || 'USD' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-surface-border last:border-0">
                <span className="text-gray-400 text-sm">{item.label}</span>
                <span className="text-white text-sm font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-display font-semibold text-white mb-4">Price Metrics</h3>
          <div className="space-y-3">
            {[
              { label: 'Current Price', value: `$${stock?.currentPrice?.toFixed(2) || '—'}` },
              { label: 'Change', value: `${(stock?.change || 0) >= 0 ? '+' : ''}${(stock?.change || 0).toFixed(2)}`, colored: true, raw: stock?.change },
              { label: 'Change %', value: `${(stock?.changePercent || 0) >= 0 ? '+' : ''}${(stock?.changePercent || 0).toFixed(2)}%`, colored: true, raw: stock?.changePercent },
              { label: 'Day Range', value: stock ? `$${stock.lowPrice?.toFixed(2)} – $${stock.highPrice?.toFixed(2)}` : 'N/A' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-surface-border last:border-0">
                <span className="text-gray-400 text-sm">{item.label}</span>
                <span className={`text-sm font-mono font-medium ${
                  item.colored
                    ? ((item.raw || 0) >= 0 ? 'text-accent-green' : 'text-accent-red')
                    : 'text-white'
                }`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trade Modal */}
      {tradeModalOpen && stock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-sm animate-fade-in">
          <div className="card p-6 w-full max-w-md bg-dark-800 border border-surface-border shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className={`text-xl font-bold ${tradeType === 'BUY' ? 'text-accent-green' : 'text-accent-red'}`}>
                  {tradeType === 'BUY' ? '🟢' : '🔴'} {tradeType} {stock.symbol}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">{stock.companyName}</p>
              </div>
              <button onClick={() => setTradeModalOpen(false)} className="text-gray-400 hover:text-white p-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleTrade} className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Market Price</span>
                <span className="text-2xl font-mono text-white font-bold">${stock.currentPrice?.toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Quantity (Shares)</label>
                <input
                  type="number"
                  min="1"
                  max={tradeType === 'SELL' ? holding?.quantity : undefined}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="input-field text-center text-lg font-mono"
                  required
                />
                {tradeType === 'SELL' && holding && (
                  <p className="text-xs text-gray-500 mt-1 text-center">Max: {holding.quantity} shares</p>
                )}
              </div>

              <div className="bg-dark-900 p-4 rounded-xl border border-surface-border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Estimated Total</span>
                  <span className="font-mono text-white font-bold">${estimatedTotal.toFixed(2)}</span>
                </div>
                {tradeType === 'BUY' && (
                  <div className="flex justify-between items-center border-t border-surface-border pt-2">
                    <span className="text-gray-400 text-sm">Available Cash</span>
                    <span className={`font-mono font-medium ${
                      estimatedTotal > (user?.portfolioBalance || 0) ? 'text-accent-red' : 'text-accent-green'
                    }`}>
                      ${user?.portfolioBalance?.toFixed(2)}
                    </span>
                  </div>
                )}
                {tradeType === 'SELL' && holding && (
                  <div className="flex justify-between items-center border-t border-surface-border pt-2">
                    <span className="text-gray-400 text-sm">Est. P&L</span>
                    {(() => {
                      const pnl = (stock.currentPrice - holding.averageBuyPrice) * quantity;
                      return (
                        <span className={`font-mono font-medium ${pnl >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                          {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={tradeLoading || (tradeType === 'BUY' && estimatedTotal > (user?.portfolioBalance || 0))}
                className={`w-full py-3 rounded-xl font-bold transition-all active:scale-98 ${
                  tradeType === 'BUY'
                    ? 'bg-accent-green text-dark-900 hover:bg-opacity-90'
                    : 'bg-accent-red text-white hover:bg-opacity-90'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {tradeLoading ? 'Processing...' : `Confirm ${tradeType}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockDetailPage;
