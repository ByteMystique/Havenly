import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiClient } from '../utils/api';
import { dataService } from '../services/dataService';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [userRole, setUserRole] = useState('student');
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize from stored session on mount
  useEffect(() => {
    const session = localStorage.getItem('session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.user?.email) {
          setUserEmail(parsed.user.email);
          setUserName(parsed.user.user_metadata?.full_name || '');
          setUserId(parsed.user.id || '');
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        localStorage.removeItem('session');
      }
    }
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) setUserRole(storedRole);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email, password, role = 'student') => {
    setAuthError(null);
    try {
      const data = await apiClient.login(email, password);
      apiClient.setToken(data.session);
      const resolvedRole = role || localStorage.getItem('userRole') || 'student';
      localStorage.setItem('userRole', resolvedRole);
      setUserEmail(data.session.user?.email || email);
      setUserName(data.session.user?.user_metadata?.full_name || '');
      setUserId(data.session.user?.id || '');
      setUserRole(resolvedRole);
      setIsLoggedIn(true);
      // Welcome notification (deferred so NotificationContext is mounted)
      setTimeout(() => {
        dataService.addNotification({
          type: 'welcome',
          title: 'Welcome back! 👋',
          message: `Good to see you again, ${data.session.user?.user_metadata?.full_name || email.split('@')[0]}!`,
          link: resolvedRole === 'owner' ? '/owner/dashboard' : '/hostels',
        });
      }, 100);
      return data;
    } catch (error) {
      const message = error.message || 'Login failed';
      setAuthError(message);
      throw error;
    }
  }, []);

  const signup = useCallback(async (email, password, name, role = 'student') => {
    setAuthError(null);
    try {
      const data = await apiClient.signup(email, password, name);
      if (data.session) {
        apiClient.setToken(data.session);
        setIsLoggedIn(true);
      }
      const resolvedRole = role || localStorage.getItem('userRole') || 'student';
      localStorage.setItem('userRole', resolvedRole);
      setUserEmail(data.session?.user?.email || data.user?.email || email);
      setUserName(name || data.session?.user?.user_metadata?.full_name || '');
      setUserId(data.session?.user?.id || data.user?.id || '');
      setUserRole(resolvedRole);
      // Welcome notification
      setTimeout(() => {
        dataService.addNotification({
          type: 'welcome',
          title: 'Welcome to Havenly! 🎉',
          message: 'Your account is ready. Start exploring hostels near CUSAT.',
          link: '/hostels',
        });
      }, 100);
      return data;
    } catch (error) {
      const message = error.message || 'Signup failed';
      setAuthError(message);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    apiClient.clearToken();
    setIsLoggedIn(false);
    setUserName('');
    setUserEmail('');
    setUserId('');
    setUserRole('student');
    setAuthError(null);
  }, []);

  const isOwner = userRole === 'owner';
  const displayName = userName || (userEmail ? userEmail.split('@')[0] : 'User');

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        userName,
        userEmail,
        userId,
        userRole,
        isOwner,
        displayName,
        login,
        signup,
        logout,
        isLoading,
        authError,
        setAuthError,
        isDemoMode: apiClient.isDemoMode(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
