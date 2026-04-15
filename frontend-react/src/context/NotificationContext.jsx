import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { dataService } from '../services/dataService';

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markRead: () => {},
  markAllRead: () => {},
  refresh: () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const intervalRef = useRef(null);

  // Check if user is logged in by reading localStorage directly
  // This avoids depending on AuthContext timing
  function isSessionActive() {
    try {
      const s = JSON.parse(localStorage.getItem('session'));
      return !!s?.access_token;
    } catch { return false; }
  }

  const refresh = useCallback(async () => {
    if (!isSessionActive()) return; // Skip if not logged in
    try {
      const data = await dataService.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch { /* silent fail */ }
  }, []);

  // Start polling - but only when there's an active session
  useEffect(() => {
    // Check on mount
    refresh();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      if (isSessionActive()) {
        refresh();
      }
    }, 15000); // poll every 15s

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  const addNotification = useCallback(async ({ type, title, message, link = null }) => {
    if (!isSessionActive()) return;
    try {
      await dataService.addNotification({ type, title, message, link });
      await refresh();
    } catch { /* ignore */ }
  }, [refresh]);

  const markRead = useCallback(async (id) => {
    // Optimistic update first
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try { await dataService.markNotificationRead(id); } catch { /* ignore */ }
  }, []);

  const markAllRead = useCallback(async () => {
    // Optimistic update first
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try { await dataService.markAllNotificationsRead(); } catch { /* ignore */ }
  }, []);

  // Expose a way for AuthContext to trigger refresh after login
  const onLogin = useCallback(() => {
    setTimeout(refresh, 500);
  }, [refresh]);

  const onLogout = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount,
      addNotification, markRead, markAllRead,
      refresh, onLogin, onLogout
    }}>
      {children}
    </NotificationContext.Provider>
  );
}
