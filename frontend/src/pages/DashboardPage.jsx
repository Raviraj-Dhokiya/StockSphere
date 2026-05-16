import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchWatchlist, removeFromWatchlist } from '../store/slices/watchlistSlice';
import { fetchPopularQuotes } from '../store/slices/stocksSlice';
import toast from 'react-hot-toast';

const POPULAR_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'NVDA'];

const StatCard = ({ label, value, sub, accent, icon }) => (
  <div className="card p-5 hover:border-gray-600 transition-colors">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">{label}</p>
        <p className={`font-display font-bold text-2xl ${accent ? 'text-accent-green' : 'text-white'}`}>{value}</p>
        {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
      </div>
      <div className="w-10 h-10 rounded-xl bg-dark-800 flex items-center justify-center text-gray-500">
        {icon}
      </div>
    </div>
  </div>
);

const DashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { stocks: watchlistStocks, loading: watchlistLoading } = useSelector((state) => state.watchlist);
  const { popular: popularQuotes, popularLoading: quotesLoading, quotes } = useSelector((state) => state.stocks);
  const { data: portfolio } = useSelector((state) => state.portfolio);

  useEffect(() => {
    dispatch(fetchWatchlist());
    dispatch(fetchPopularQuotes(POPULAR_SYMBOLS));
  }, [dispatch]);

  const handleRemoveWatchlist = async (symbol) => {
    const result = await dispatch(removeFromWatchlist(symbol));
    if (removeFromWatchlist.fulfilled.match(result)) toast.success(`Removed ${symbol}`);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'Trader';

  const formatBalance = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-white">
            {greeting}, <span className="text-accent-green">{firstName}</span> 👋
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link to="/market" className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Explore Market
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Available Cash"
          value={formatBalance(user?.portfolioBalance)}
          sub="Virtual balance"
          accent
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Portfolio Value"
          value={formatBalance((portfolio?.totalCurrentValue || 0) + (user?.portfolioBalance || 0))}
          sub={portfolio?.totalInvested > 0
            ? `${(portfolio?.pnlPercent || 0) >= 0 ? '+' : ''}${(portfolio?.pnlPercent || 0).toFixed(2)}% return`
            : 'No investments yet'}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatCard
          label="Watchlist"
          value={watchlistStocks.length}
          sub={`of 20 slots used`}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>}
        />
        <StatCard
          label="Member Since"
          value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
          sub="Account status: Active"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Popular stocks */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-white">Market Movers</h2>
            <Link to="/market" className="text-accent-green text-xs hover:underline font-medium">View All →</Link>
          </div>

          {quotesLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton h-14 rounded-xl" />
              ))}
            </div>
          ) : popularQuotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              <p>Market data unavailable. Check back soon.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {popularQuotes.map((stock) => {
                const isUp = (stock.change || 0) >= 0;
                return (
                  <Link
                    key={stock.symbol}
                    to={`/stock/${stock.symbol}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-dark-800 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-dark-800 border border-surface-border flex items-center justify-center">
                        <span className="font-mono font-bold text-xs text-gray-300">{stock.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="font-mono font-semibold text-white text-sm group-hover:text-accent-green transition-colors">{stock.symbol}</p>
                        <p className="text-gray-500 text-xs truncate max-w-[140px]">{stock.companyName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-white text-sm">${stock.currentPrice?.toFixed(2)}</p>
                      <p className={`text-xs font-mono ${isUp ? 'text-accent-green' : 'text-accent-red'}`}>
                        {isUp ? '▲' : '▼'} {Math.abs(stock.changePercent || 0).toFixed(2)}%
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Watchlist sidebar */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-white">Watchlist</h2>
            <Link to="/watchlist" className="text-accent-green text-xs hover:underline font-medium">Manage →</Link>
          </div>

          {watchlistLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
            </div>
          ) : watchlistStocks.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-dark-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm mb-3">No stocks in watchlist</p>
              <Link to="/market" className="text-accent-green text-xs hover:underline">Search stocks →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {watchlistStocks.map((stock) => {
                const quote = quotes[stock.symbol];
                const isUp = (quote?.change || 0) >= 0;
                return (
                  <div key={stock.symbol} className="flex items-center justify-between p-3 rounded-xl hover:bg-dark-800 transition-colors group">
                    <Link to={`/stock/${stock.symbol}`} className="flex-1 min-w-0">
                      <p className="font-mono font-bold text-sm text-white group-hover:text-accent-green transition-colors">{stock.symbol}</p>
                      <p className="text-gray-500 text-xs truncate">{stock.companyName}</p>
                    </Link>
                    <div className="text-right mr-3">
                      {quote ? (
                        <>
                          <p className="font-mono font-bold text-white text-sm">${quote.currentPrice?.toFixed(2)}</p>
                          <p className={`text-xs font-mono ${isUp ? 'text-accent-green' : 'text-accent-red'}`}>
                            {isUp ? '▲' : '▼'} {Math.abs(quote.changePercent || 0).toFixed(2)}%
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-500">—</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveWatchlist(stock.symbol)}
                      className="text-gray-600 hover:text-accent-red transition-colors p-1"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* User profile card */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-white mb-5">Account Overview</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center flex-shrink-0">
            <span className="font-display font-bold text-2xl text-white">
              {user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
            </span>
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-500 text-xs mb-1">Full Name</p>
              <p className="text-white font-medium">{user?.name}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Email</p>
              <p className="text-white font-medium truncate">{user?.email}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Available Cash</p>
              <p className="text-accent-green font-mono font-bold">{formatBalance(user?.portfolioBalance)}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/portfolio" className="btn-secondary text-sm py-2 px-4">View Portfolio</Link>
            <Link to="/community" className="btn-ghost text-sm">Community →</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
