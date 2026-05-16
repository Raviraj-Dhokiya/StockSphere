import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import useStockSearch from '../hooks/useStockSearch';
import { fetchNotifications, markNotificationsRead } from '../store/slices/notificationSlice';

// NYSE open: 9:30am-4pm ET = 13:30-20:00 UTC, Mon-Fri
const isMarketOpen = () => {
  const now = new Date();
  const day = now.getUTCDay();
  const mins = now.getUTCHours() * 60 + now.getUTCMinutes();
  return day >= 1 && day <= 5 && mins >= 810 && mins < 1200;
};

const Navbar = ({ sidebarCollapsed }) => {
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { items: notifications, unreadCount } = useSelector((s) => s.notifications);
  const { results, loading, search, clearResults } = useStockSearch();
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const open = isMarketOpen();

  useEffect(() => { dispatch(fetchNotifications()); }, [dispatch]);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);
    setShowSearch(true);
    search(val);
  };

  const selectStock = (symbol) => {
    setQuery(''); setShowSearch(false); clearResults();
    navigate(`/stock/${symbol}`);
  };

  const handleNotifClick = () => {
    setShowNotifs((s) => !s);
    if (unreadCount > 0) dispatch(markNotificationsRead());
  };

  return (
    <header className={`fixed top-0 right-0 z-30 bg-dark-800/80 backdrop-blur-md border-b border-surface-border transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'} left-0`}>
      <div className="flex items-center gap-4 px-6 h-16">

        {/* Search */}
        <div className="flex-1 max-w-md relative" ref={searchRef}>
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            {loading
              ? <div className="w-4 h-4 border border-gray-500 border-t-accent-green rounded-full animate-spin" />
              : <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            }
          </div>
          <input
            type="text" placeholder="Search stocks — AAPL, Tesla..."
            className="w-full bg-dark-700 border border-surface-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-accent-green transition-colors"
            value={query} onChange={handleSearch}
            onFocus={() => results.length > 0 && setShowSearch(true)}
          />
          {showSearch && (results.length > 0 || (query && !loading)) && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-dark-700 border border-surface-border rounded-xl shadow-card overflow-hidden z-50 animate-fade-in">
              {results.length > 0 ? results.map((s) => (
                <button key={s.symbol} onClick={() => selectStock(s.symbol)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors text-left group">
                  <span className="font-mono font-bold text-accent-green text-sm w-16 flex-shrink-0">{s.symbol}</span>
                  <span className="text-gray-300 text-sm truncate group-hover:text-white transition-colors">{s.description}</span>
                </button>
              )) : (
                <div className="px-4 py-3 text-gray-500 text-sm">No results for "{query}"</div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Market status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium ${open ? 'border-accent-green/30 bg-accent-green-dim text-accent-green' : 'border-surface-border bg-dark-700 text-gray-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-accent-green animate-pulse' : 'bg-gray-600'}`} />
            {open ? 'MARKET OPEN' : 'MARKET CLOSED'}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button onClick={handleNotifClick}
              className="relative w-9 h-9 rounded-xl bg-surface border border-surface-border flex items-center justify-center hover:border-gray-500 transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-green rounded-full animate-pulse" />}
            </button>
            {showNotifs && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-dark-700 border border-surface-border rounded-xl shadow-card overflow-hidden z-50 animate-fade-in max-h-96 flex flex-col">
                <div className="p-3 border-b border-surface-border font-display font-semibold text-white text-sm">Notifications</div>
                <div className="overflow-y-auto">
                  {notifications.length === 0
                    ? <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
                    : notifications.map((n) => (
                      <Link key={n._id} to={n.link || '#'} onClick={() => setShowNotifs(false)}
                        className={`block p-3 border-b border-surface-border hover:bg-surface transition-colors ${!n.read ? 'bg-dark-800' : ''}`}>
                        <p className="text-sm text-gray-300">{n.message}</p>
                        <span className="text-[10px] text-gray-500 mt-1 block">{new Date(n.createdAt).toLocaleString()}</span>
                      </Link>
                    ))
                  }
                </div>
              </div>
            )}
          </div>

          {/* User greeting */}
          <div className="hidden sm:block text-right">
            <p className="text-xs text-gray-500">Welcome back</p>
            <p className="text-sm font-medium text-white">{user?.name?.split(' ')[0]}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
