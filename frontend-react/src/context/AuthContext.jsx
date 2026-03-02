import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || '');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('userEmail') || '');

  const login = useCallback((email) => {
    localStorage.setItem('userEmail', email);
    localStorage.setItem('isLoggedIn', 'true');
    setUserEmail(email);
    setIsLoggedIn(true);
  }, []);

  const signup = useCallback((name, email) => {
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('isLoggedIn', 'true');
    setUserName(name);
    setUserEmail(email);
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    setUserName('');
    setUserEmail('');
  }, []);

  const displayName = userName || (userEmail ? userEmail.split('@')[0] : 'User');

  return (
    <AuthContext.Provider value={{ isLoggedIn, userName, userEmail, displayName, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
