import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Cards from './pages/Cards';
import Expenses from './pages/Expenses';
import ExpenseForm from './pages/ExpenseForm';
import Projection from './pages/Projection';
import Suggestions from './pages/Suggestions';
import Goals from './pages/Goals';
import GoalForm from './pages/GoalForm';
import GoalDetail from './pages/GoalDetail';
import Profile from './pages/Profile';
import { useAuthStore } from './store/authStore';
import { useAuthHydrated } from './hooks/useAuthHydrated';
import Loading from './components/ui/Loading';

function PublicRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthHydrated();

  if (!hydrated) return <Loading />;
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}

function RootRedirect() {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthHydrated();

  if (!hydrated) return <Loading />;
  return <Navigate to={token ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cards" element={<Cards />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/expenses/new" element={<ExpenseForm />} />
          <Route path="/expenses/:id/edit" element={<ExpenseForm />} />
          <Route path="/projection" element={<Projection />} />
          <Route path="/suggestions" element={<Suggestions />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/goals/new" element={<GoalForm />} />
          <Route path="/goals/:id" element={<GoalDetail />} />
          <Route path="/goals/:id/edit" element={<GoalForm />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
