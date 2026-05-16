import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchPortfolio, fetchTrades } from '../store/slices/portfolioSlice';

const PortfolioPage = () => {
  const dispatch = useDispatch();
  const { data: portfolio, trades, loading, error } = useSelector((state) => state.portfolio);
  const { quotes } = useSelector((state) => state.stocks);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchPortfolio());
    dispatch(fetchTrades());
  }, [dispatch]);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  if (loading && !portfolio) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-green"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center max-w-2xl mx-auto">
        <p className="text-accent-red mb-4">{error}</p>
        <button onClick={() => dispatch(fetchPortfolio())} className="btn-secondary">Try Again</button>
      </div>
    );
  }

  const holdings = portfolio?.holdings || [];

  // Calculate live portfolio values based on real-time quotes
  let liveTotalCurrentValue = 0;
  const liveTotalInvested = portfolio?.totalInvested || 0;

  const liveHoldings = holdings.map((holding) => {
    const livePrice = quotes[holding.symbol]?.currentPrice || holding.currentPrice;
    liveTotalCurrentValue += livePrice * holding.quantity;
    return { ...holding, livePrice };
  });

  const liveTotalPnL = liveTotalCurrentValue - liveTotalInvested;
  const livePnlPercent = liveTotalInvested > 0 ? (liveTotalPnL / liveTotalInvested) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-white">My Portfolio</h1>
          <p className="text-gray-400 mt-1">Manage your holdings and track performance</p>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 bg-gradient-to-br from-dark-800 to-dark-900 border-accent-green/20">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Total Value</p>
          <p className="font-display font-bold text-3xl text-white">
            {formatCurrency(liveTotalCurrentValue + (user?.portfolioBalance || 0))}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Available Cash</p>
          <p className="font-display font-bold text-2xl text-accent-green font-mono">
            {formatCurrency(user?.portfolioBalance)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Total Invested</p>
          <p className="font-display font-bold text-2xl text-white font-mono">
            {formatCurrency(liveTotalInvested)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Total Return</p>
          <div className="flex items-baseline gap-2">
            <p className={`font-display font-bold text-2xl font-mono ${liveTotalPnL >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
              {liveTotalPnL >= 0 ? '+' : ''}{formatCurrency(liveTotalPnL)}
            </p>
            <p className={`text-sm font-medium ${livePnlPercent >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
              ({livePnlPercent.toFixed(2)}%)
            </p>
          </div>
        </div>
      </div>

      {/* Holdings & Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holdings Table */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-display font-semibold text-xl text-white">Current Holdings</h2>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-dark-800 border-b border-surface-border">
                    <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Asset</th>
                    <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Shares</th>
                    <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Price</th>
                    <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Current</th>
                    <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {liveHoldings.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">
                        No active holdings. <Link to="/market" className="text-accent-green hover:underline">Start trading!</Link>
                      </td>
                    </tr>
                  ) : (
                    liveHoldings.map((holding) => {
                      const isPositive = holding.livePrice >= holding.averageBuyPrice;
                      const pnl = (holding.livePrice - holding.averageBuyPrice) * holding.quantity;
                      const pnlPct = ((holding.livePrice - holding.averageBuyPrice) / holding.averageBuyPrice) * 100;

                      return (
                        <tr key={holding.symbol} className="hover:bg-dark-800/50 transition-colors">
                          <td className="p-4">
                            <Link to={`/stock/${holding.symbol}`} className="block">
                              <span className="font-mono font-bold text-white hover:text-accent-green">{holding.symbol}</span>
                              <span className="block text-xs text-gray-500 truncate max-w-[120px]">{holding.companyName}</span>
                            </Link>
                          </td>
                          <td className="p-4 font-mono text-gray-300">{holding.quantity}</td>
                          <td className="p-4 font-mono text-gray-300">{formatCurrency(holding.averageBuyPrice)}</td>
                          <td className="p-4 font-mono text-white">{formatCurrency(holding.livePrice)}</td>
                          <td className="p-4 text-right">
                            <span className={`block font-mono ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
                              {isPositive ? '+' : ''}{formatCurrency(pnl)}
                            </span>
                            <span className={`block text-xs ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
                              {isPositive ? '+' : ''}{pnlPct.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Trade History */}
        <div className="space-y-4">
          <h2 className="font-display font-semibold text-xl text-white">Recent Transactions</h2>
          <div className="card p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {trades.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No trades yet</div>
            ) : (
              trades.slice(0, 10).map((trade) => (
                <div key={trade._id} className="flex justify-between items-center p-3 rounded-xl bg-dark-800 border border-surface-border">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${trade.type === 'BUY' ? 'bg-accent-green-dim text-accent-green' : 'bg-accent-red-dim text-accent-red'
                      }`}>
                      {trade.type}
                    </div>
                    <div>
                      <span className="font-mono font-bold text-white text-sm">{trade.symbol}</span>
                      <span className="block text-xs text-gray-500">{new Date(trade.executedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block font-mono text-white text-sm">
                      {trade.quantity} @ {formatCurrency(trade.pricePerShare)}
                    </span>
                    <span className="block text-xs text-gray-400">
                      Total: {formatCurrency(trade.totalAmount)}
                    </span>
                  </div>
                </div>
              ))
            )}
            {trades.length > 10 && (
              <button className="w-full py-2 text-xs text-accent-green hover:underline">View All History</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioPage;
