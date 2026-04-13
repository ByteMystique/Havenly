import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { dataService } from '../services/dataService';

const NotificationContext = createContext();

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const refresh = useCallback(() => {
    setNotifications(dataService.getNotifications());
  }, []);

  useEffect(() => {
    refresh();
    // Poll every 5s for any new notifications from other tabs / services
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  const addNotification = useCallback(({ type, title, message, link = null }) => {
    dataService.addNotification({ type, title, message, link });
    refresh();
  }, [refresh]);

  const markRead = useCallback((id) => {
    dataService.markNotificationRead(id);
    refresh();
  }, [refresh]);

  const markAllRead = useCallback(() => {
    dataService.markAllNotificationsRead();
    refresh();
  }, [refresh]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}
