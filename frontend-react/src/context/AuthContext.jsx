import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {

  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem('isLoggedIn') === 'true'
  );

  const [userName, setUserName] = useState(
    () => localStorage.getItem('userName') || ''
  );

  const [userEmail, setUserEmail] = useState(
    () => localStorage.getItem('userEmail') || ''
  );

  const [userId, setUserId] = useState(
    () => localStorage.getItem('userId') || null
  );

  const login = useCallback((email, id) => {
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userId', id);
    localStorage.setItem('isLoggedIn', 'true');

    setUserEmail(email);
    setUserId(id);
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
    localStorage.removeItem('userId');

    setIsLoggedIn(false);
    setUserName('');
    setUserEmail('');
    setUserId(null);
  }, []);

  const displayName =
    userName || (userEmail ? userEmail.split('@')[0] : 'User');

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        userName,
        userEmail,
        userId,
        displayName,
        login,
        signup,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}