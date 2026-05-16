import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../store/slices/authSlice';
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

const getStrength = (pwd) => {
  if (!pwd) return null;
  if (pwd.length < 6) return { label: 'Too short', color: 'bg-accent-red', width: '20%' };
  if (pwd.length < 8)  return { label: 'Weak',      color: 'bg-accent-yellow', width: '40%' };
  if (pwd.length < 12) return { label: 'Fair',      color: 'bg-accent-blue', width: '65%' };
  return                      { label: 'Strong',    color: 'bg-accent-green', width: '100%' };
};

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((s) => s.auth);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
    return () => dispatch(clearError());
  }, [isAuthenticated, navigate, dispatch]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill in all fields');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return toast.error('Please enter a valid email address');
    
    if (form.password.length < 6)               return toast.error('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword)  return toast.error('Passwords do not match');
    const result = await dispatch(registerUser({ name: form.name, email: form.email, password: form.password }));
    if (registerUser.fulfilled.match(result)) toast.success('Account created! Welcome aboard 🎉');
    else toast.error(result.payload || 'Registration failed');
  };

  const strength = getStrength(form.password);

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-dark-800 border-r border-surface-border relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl" />
        <div className="relative"><Logo /></div>
        <div className="relative space-y-8">
          <div>
            <h1 className="font-display font-bold text-5xl text-white leading-tight">
              Your portfolio<br />
              <span className="text-accent-green">starts here.</span>
            </h1>
            <p className="mt-4 text-gray-400 text-lg">
              Join thousands of traders using real-time data to make smarter decisions.
            </p>
          </div>
          <div className="space-y-3">
            {[
              { icon: '💰', text: 'Start with $100,000 virtual portfolio' },
              { icon: '📊', text: 'Real-time stock data via Finnhub API' },
              { icon: '📈', text: 'Interactive charts with historical data' },
              { icon: '⭐', text: 'Custom watchlist up to 20 stocks' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-gray-300">
                <span>{icon}</span>
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-gray-600 text-sm">© 2026 StockSphere. For educational use only.</p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-8">
            <h2 className="font-display font-bold text-3xl text-white">Create account</h2>
            <p className="text-gray-400 mt-2">Get started with your free trading account</p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 bg-accent-red-dim border border-accent-red/30 rounded-xl px-4 py-3">
              <p className="text-accent-red text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full name</label>
              <input type="text" className="input-field" placeholder="SunFlower"
                value={form.name} onChange={set('name')} autoComplete="name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
              <input type="email" className="input-field" placeholder="ravi@gmail.com"
                value={form.email} onChange={set('email')} autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} className="input-field pr-12"
                  placeholder="Min. 6 characters" value={form.password}
                  onChange={set('password')} autoComplete="new-password"
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
              {strength && (
                <div className="mt-2">
                  <div className="h-1 bg-dark-700 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} rounded-full transition-all duration-300`} style={{ width: strength.width }} />
                  </div>
                  <p className={`text-xs mt-1 ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm password</label>
              <input
                type="password"
                className={`input-field ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-accent-red' : ''}`}
                placeholder="Repeat password" value={form.confirmPassword}
                onChange={set('confirmPassword')} autoComplete="new-password"
              />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-accent-red text-xs mt-1">Passwords do not match</p>
              )}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <><div className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />Creating account...</> : "Create Account — It's Free"}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-green hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
