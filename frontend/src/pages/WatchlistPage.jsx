import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWatchlist, removeFromWatchlist } from '../store/slices/watchlistSlice';
import { fetchPopularQuotes } from '../store/slices/stocksSlice';
import toast from 'react-hot-toast';

const WatchlistPage = () => {
  const dispatch = useDispatch();
  const { stocks, loading } = useSelector((state) => state.watchlist);
  const { quotes, popularLoading } = useSelector((state) => state.stocks);

  useEffect(() => {
    dispatch(fetchWatchlist());
  }, [dispatch]);

  // Fetch quotes for all watchlist stocks using Redux
  useEffect(() => {
    if (stocks.length > 0) {
      dispatch(fetchPopularQuotes(stocks.map((s) => s.symbol)));
    }
  }, [stocks, dispatch]);

  const handleRemove = async (symbol) => {
    const result = await dispatch(removeFromWatchlist(symbol));
    if (removeFromWatchlist.fulfilled.match(result)) toast.success(`Removed ${symbol}`);
    else toast.error('Failed to remove');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-white">Watchlist</h1>
          <p className="text-gray-400 mt-1">{stocks.length} of 20 slots used</p>
        </div>
        <Link to="/market" className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Stock
        </Link>
      </div>

      {/* Capacity bar */}
      <div className="card p-4">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Capacity</span>
          <span className="font-mono">{stocks.length}/20</span>
        </div>
        <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-green to-accent-blue rounded-full transition-all duration-700"
            style={{ width: `${(stocks.length / 20) * 100}%` }}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : stocks.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-dark-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h3 className="font-display font-bold text-xl text-white mb-2">Watchlist is empty</h3>
          <p className="text-gray-400 mb-6">Search for stocks to start tracking</p>
          <Link to="/market" className="btn-primary inline-block">Explore Market</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {stocks.map((stock, idx) => {
            const quote = quotes[stock.symbol];
            const isUp = (quote?.change || 0) >= 0;
            return (
              <div
                key={stock.symbol}
                className="card p-4 flex items-center justify-between hover:border-gray-600 transition-all group animate-slide-up"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <Link to={`/stock/${stock.symbol}`} className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-dark-800 border border-surface-border flex items-center justify-center flex-shrink-0">
                    <span className="font-mono font-bold text-sm text-gray-300">{stock.symbol.slice(0, 2)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono font-bold text-white group-hover:text-accent-green transition-colors">{stock.symbol}</p>
                    <p className="text-gray-400 text-sm truncate">{stock.companyName}</p>
                  </div>
                </Link>

                <div className="flex items-center gap-4 mr-3">
                  {popularLoading ? (
                    <div className="skeleton h-8 w-20 rounded" />
                  ) : quote ? (
                    <div className="text-right">
                      <p className="font-mono font-bold text-white">${quote.currentPrice?.toFixed(2)}</p>
                      <p className={`text-xs font-mono ${isUp ? 'text-accent-green' : 'text-accent-red'}`}>
                        {isUp ? '▲' : '▼'} {Math.abs(quote.changePercent || 0).toFixed(2)}%
                      </p>
                    </div>
                  ) : (
                    <span className="text-gray-600 font-mono text-xs">—</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link to={`/stock/${stock.symbol}`} className="btn-ghost text-xs px-3 py-1.5">View →</Link>
                  <button
                    onClick={() => handleRemove(stock.symbol)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-accent-red hover:bg-accent-red-dim transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WatchlistPage;
