import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

export default function OwnerRoute({ children }) {
  const { isLoggedIn, isLoading, isOwner } = useAuth();

  if (isLoading) return <Loader text="Checking access..." />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isOwner) return <Navigate to="/hostels" replace />;

  return children;
}
