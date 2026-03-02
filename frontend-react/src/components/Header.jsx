import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Header() {
  const { isLoggedIn, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      toast.info('Goodbye!', 'You have been logged out successfully.', 2000);
      logout();
      setTimeout(() => navigate('/'), 500);
    }
  };

  return (
    <header className="header">
      <div className="container">
        <h1 className="logo">Havenly</h1>
        <nav>
          {!isLoggedIn && <NavLink to="/">Login</NavLink>}
          <NavLink to="/hostels">Hostels</NavLink>
          {isLoggedIn && <NavLink to="/dashboard">Dashboard</NavLink>}
          {isLoggedIn && (
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
