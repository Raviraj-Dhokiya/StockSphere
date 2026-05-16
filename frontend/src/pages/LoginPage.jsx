import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const Logo = () => (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-xl bg-accent-green flex items-center justify-center shadow-glow">
      <svg className="w-5 h-5 text-dark-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.5 19l9-13.5L15 12l4.5-6L22 8.5" />
      </svg>
    </div>
    <span className="font-display font-bold text-white text-lg">StockSphere</span>
  </div>
);

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, isAuthenticated } = useSelector((s) => s.auth);
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
    return () => dispatch(clearError());
  }, [isAuthenticated, navigate, from, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields');
    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) toast.success('Welcome back! 🚀');
    else toast.error(result.payload || 'Login failed');
  };

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Left panel - branding (desktop only) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-dark-800 border-r border-surface-border relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-green/10 rounded-full blur-3xl" />
        <div className="relative"><Logo /></div>
        <div className="relative space-y-6">
          <div>
            <h1 className="font-display font-bold text-5xl text-white leading-tight">
              Trade smarter,<br />
              <span className="text-accent-green">not harder.</span>
            </h1>
            <p className="mt-4 text-gray-400 text-lg leading-relaxed max-w-md">
              Real-time market data, advanced charting, and portfolio analytics — all in one place.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Live Prices', value: 'Real-time' },
              { label: 'Stocks Tracked', value: '10,000+' },
              { label: 'Virtual Balance', value: '$100K' },
            ].map((s) => (
              <div key={s.label} className="bg-dark-700 border border-surface-border rounded-xl p-4">
                <p className="font-display font-bold text-accent-green text-xl">{s.value}</p>
                <p className="text-gray-500 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-gray-600 text-sm">© 2026 StockSphere. All rights reserved.</p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="flex lg:hidden mb-8"><Logo /></div>

          <div className="mb-8">
            <h2 className="font-display font-bold text-3xl text-white">Sign in</h2>
            <p className="text-gray-400 mt-2">Access your trading dashboard</p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 bg-accent-red-dim border border-accent-red/30 rounded-xl px-4 py-3">
              <p className="text-accent-red text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
              <input
                type="email" name="email" className="input-field"
                placeholder="you@example.com" value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} name="password"
                  className="input-field pr-12" placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d={showPwd
                        ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"}
                    />
                  </svg>
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <><div className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />Signing in...</> : 'Sign in to Dashboard'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-500 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent-green hover:underline font-medium">Create account</Link>
          </p>

          <div className="mt-4 p-3 bg-dark-800 border border-surface-border rounded-xl text-center">
            <p className="text-xs text-gray-500">
              New here?{' '}
              <Link to="/register" className="text-accent-blue hover:underline">Create a free account</Link>
              {' '}— start with $100,000 virtual balance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
