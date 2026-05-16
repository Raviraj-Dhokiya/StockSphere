import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToWatchlist } from '../store/slices/watchlistSlice';
import { fetchPopularQuotes } from '../store/slices/stocksSlice';
import useStockSearch from '../hooks/useStockSearch';
import toast from 'react-hot-toast';

const TRENDING = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.' },
  { symbol: 'META', name: 'Meta Platforms' },
  { symbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'AMD', name: 'Advanced Micro Devices' },
  { symbol: 'INTC', name: 'Intel Corporation' },
  { symbol: 'BABA', name: 'Alibaba Group' },
  { symbol: 'JPM', name: 'JPMorgan Chase' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'WMT', name: 'Walmart Inc.' },
  { symbol: 'JNJ', name: 'Johnson & Johnson' },
  { symbol: 'BAC', name: 'Bank of America' },
  { symbol: 'DIS', name: 'Walt Disney' },
  { symbol: 'PG', name: 'Procter & Gamble' },
  { symbol: 'MA', name: 'Mastercard Inc.' },
  { symbol: 'HD', name: 'Home Depot' }
];

const MarketPage = () => {
  const [query, setQuery] = useState('');
  const { results, loading, search, clearResults } = useStockSearch();
  const dispatch = useDispatch();
  const { stocks: watchlistStocks } = useSelector((state) => state.watchlist);
  const { quotes, popularLoading } = useSelector((state) => state.stocks);

  useEffect(() => {
    dispatch(fetchPopularQuotes(TRENDING.map(s => s.symbol)));
  }, [dispatch]);

  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);
    search(val);
  };

  const handleAdd = async (symbol, companyName) => {
    const result = await dispatch(addToWatchlist({ symbol, companyName }));
    if (addToWatchlist.fulfilled.match(result)) {
      toast.success(`${symbol} added to watchlist ⭐`);
    } else {
      toast.error(result.payload || 'Failed to add to watchlist');
    }
  };

  const isWatched = (symbol) => watchlistStocks.some((s) => s.symbol === symbol.toUpperCase());

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-white">Market</h1>
        <p className="text-gray-400 mt-1">Search and discover stocks</p>
      </div>

      {/* Search bar */}
      <div className="card p-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            {loading ? (
              <div className="w-5 h-5 border border-gray-600 border-t-accent-green rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
          <input
            type="text"
            placeholder="Search by symbol or company name..."
            className="input-field pl-12 text-base py-4"
            value={query}
            onChange={handleSearch}
            autoFocus
          />
          {query && (
            <button
              onClick={() => { setQuery(''); clearResults(); }}
              className="absolute inset-y-0 right-4 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-4 space-y-1">
            <p className="text-xs text-gray-500 mb-3 font-mono uppercase tracking-wide">{results.length} results</p>
            {results.map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between p-3 rounded-xl hover:bg-dark-800 transition-colors group">
                <Link to={`/stock/${stock.symbol}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-dark-800 border border-surface-border flex items-center justify-center flex-shrink-0">
                    <span className="font-mono font-bold text-xs text-gray-300">{stock.symbol.slice(0, 2)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono font-bold text-white group-hover:text-accent-green transition-colors">{stock.symbol}</p>
                    <p className="text-gray-400 text-sm truncate">{stock.description}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 ml-3">
                  <Link to={`/stock/${stock.symbol}`} className="btn-ghost text-xs px-3 py-1.5">
                    View →
                  </Link>
                  <button
                    onClick={() => handleAdd(stock.symbol, stock.description)}
                    disabled={isWatched(stock.symbol)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      isWatched(stock.symbol)
                        ? 'border-accent-green/30 bg-accent-green-dim text-accent-green cursor-default'
                        : 'border-surface-border text-gray-400 hover:border-accent-green/40 hover:text-accent-green'
                    }`}
                  >
                    {isWatched(stock.symbol) ? '★ Watched' : '☆ Watch'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {query && results.length === 0 && !loading && (
          <div className="mt-4 text-center py-6 text-gray-500">
            <p>No results for <span className="text-gray-300 font-mono">"{query}"</span></p>
            <p className="text-sm mt-1">Try searching for a symbol like AAPL or a company name</p>
          </div>
        )}
      </div>

      {/* Trending */}
      {!query && (
        <div>
          <h2 className="font-display font-semibold text-white mb-4">Trending Stocks</h2>
          <div className="space-y-3">
            {popularLoading ? (
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
              </div>
            ) : (
              TRENDING.map((stock) => {
                const quote = quotes[stock.symbol];
                const isUp = (quote?.change || 0) >= 0;
                return (
                  <div key={stock.symbol} className="card p-4 flex items-center justify-between hover:border-gray-600 transition-colors group">
                    <Link to={`/stock/${stock.symbol}`} className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-dark-800 flex items-center justify-center border border-surface-border">
                        <span className="font-mono font-bold text-sm text-gray-300">{stock.symbol.slice(0, 2)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono font-bold text-white text-lg group-hover:text-accent-green transition-colors">{stock.symbol}</p>
                        <p className="text-gray-500 text-sm truncate">{stock.name}</p>
                      </div>
                    </Link>
                    
                    <div className="flex items-center gap-6">
                      {quote ? (
                        <div className="text-right">
                          <p className="font-mono font-bold text-white text-lg">${quote.currentPrice?.toFixed(2)}</p>
                          <p className={`text-sm font-mono ${isUp ? 'text-accent-green' : 'text-accent-red'}`}>
                            {isUp ? '▲' : '▼'} {Math.abs(quote.changePercent || 0).toFixed(2)}%
                          </p>
                        </div>
                      ) : (
                        <div className="text-right text-gray-600 font-mono text-sm">—</div>
                      )}
                      
                      <button
                        onClick={() => handleAdd(stock.symbol, stock.name)}
                        disabled={isWatched(stock.symbol)}
                        className={`text-sm px-4 py-2 rounded-lg border transition-all ${
                          isWatched(stock.symbol)
                            ? 'border-accent-green/30 bg-accent-green-dim text-accent-green cursor-default'
                            : 'border-surface-border text-gray-400 hover:border-accent-green/40 hover:text-accent-green'
                        }`}
                      >
                        {isWatched(stock.symbol) ? '★ Watched' : '☆ Watch'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketPage;
