import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiClient } from '../utils/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
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
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        localStorage.removeItem('session');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    setAuthError(null);
    try {
      const data = await apiClient.login(email, password);
      apiClient.setToken(data.session);
      setUserEmail(data.session.user?.email || email);
      setUserName(data.session.user?.user_metadata?.full_name || '');
      setIsLoggedIn(true);
      return data;
    } catch (error) {
      const message = error.message || 'Login failed';
      setAuthError(message);
      throw error;
    }
  }, []);

  const signup = useCallback(async (email, password, name) => {
    setAuthError(null);
    try {
      const data = await apiClient.signup(email, password, name);
      // Note: Supabase signup may not return a session, may need email confirmation
      // If session is returned, store it
      if (data.session) {
        apiClient.setToken(data.session);
        setIsLoggedIn(true);
      }
      setUserEmail(data.user?.email || email);
      setUserName(name || data.user?.user_metadata?.full_name || '');
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
    setAuthError(null);
  }, []);

  const displayName = userName || (userEmail ? userEmail.split('@')[0] : 'User');

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        userName,
        userEmail,
        displayName,
        login,
        signup,
        logout,
        isLoading,
        authError,
        setAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
