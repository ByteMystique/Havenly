import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import NotificationCenter from './NotificationCenter';

export default function Header() {
  const { isLoggedIn, isOwner, displayName, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close user-menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile nav on route change
  const closeAll = () => { setMobileOpen(false); setUserMenuOpen(false); };

  const handleLogout = () => {
    closeAll();
    if (window.confirm('Are you sure you want to logout?')) {
      toast.info('Goodbye!', 'You have been logged out.', 2000);
      logout();
      setTimeout(() => navigate('/'), 400);
    }
  };

  // Initials avatar
  const initials = displayName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <header className="header">
      <div className="container">
        {/* Logo */}
        <Link to="/" className="logo-link" onClick={closeAll}>
          <h1 className="logo">Havenly</h1>
        </Link>

        {/* Hamburger (mobile only) */}
        <button
          className={`hamburger ${mobileOpen ? 'hamburger--open' : ''}`}
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
        >
          <span /><span /><span />
        </button>

        {/* Overlay */}
        {mobileOpen && <div className="nav-overlay" onClick={closeAll} />}

        {/* Nav */}
        <nav className={`nav-menu ${mobileOpen ? 'nav-menu--open' : ''}`}>
          <NavLink to="/" end onClick={closeAll}>Home</NavLink>
          <NavLink to="/hostels" onClick={closeAll}>Hostels</NavLink>

          {isLoggedIn && isOwner && (
            <>
              <NavLink to="/owner/dashboard" onClick={closeAll}>Dashboard</NavLink>
              <NavLink to="/owner/hostels" onClick={closeAll}>My Hostels</NavLink>
              <NavLink to="/owner/bookings" onClick={closeAll}>Bookings</NavLink>
            </>
          )}

          {isLoggedIn && !isOwner && (
            <NavLink to="/dashboard" onClick={closeAll}>Dashboard</NavLink>
          )}

          {!isLoggedIn && (
            <NavLink to="/login" className="nav-login-btn" onClick={closeAll}>Login / Sign Up</NavLink>
          )}

          {isLoggedIn && (
            <div className="nav-user-area">
              {/* Notifications */}
              <NotificationCenter />

              {/* User avatar dropdown */}
              <div className="user-menu-wrap" ref={userMenuRef}>
                <button
                  className="user-avatar-btn"
                  onClick={() => setUserMenuOpen(o => !o)}
                  aria-label="User menu"
                >
                  <span className="user-initials">{initials}</span>
                </button>
                {userMenuOpen && (
                  <div className="user-dropdown">
                    <div className="user-dropdown__header">
                      <div className="user-dropdown__initials">{initials}</div>
                      <div>
                        <div className="user-dropdown__name">{displayName}</div>
                        <div className="user-dropdown__role">{isOwner ? '🏠 Owner' : '🎓 Student'}</div>
                      </div>
                    </div>
                    <Link to="/profile" className="user-dropdown__item" onClick={closeAll}>👤 Profile</Link>
                    {isOwner
                      ? <Link to="/owner/dashboard" className="user-dropdown__item" onClick={closeAll}>📊 Dashboard</Link>
                      : <Link to="/dashboard" className="user-dropdown__item" onClick={closeAll}>📊 Dashboard</Link>
                    }
                    <button className="user-dropdown__item user-dropdown__item--danger" onClick={handleLogout}>
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
