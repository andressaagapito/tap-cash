import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAuthHydrated } from '../hooks/useAuthHydrated';
import Loading from './ui/Loading';

export default function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthHydrated();
  const location = useLocation();

  if (!hydrated) {
    return <Loading />;
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
