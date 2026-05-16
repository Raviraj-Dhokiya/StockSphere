import { useSelector } from 'react-redux';
import { Navigate, useLocation, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const { isAuthenticated, initialLoading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-surface-border border-t-accent-green rounded-full animate-spin" />
          <p className="text-gray-500 font-display text-sm tracking-wider uppercase">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
