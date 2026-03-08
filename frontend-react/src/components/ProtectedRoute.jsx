import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return <Loader text="Checking session..." />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
}
