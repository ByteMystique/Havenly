import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

const TYPE_ICON = {
  welcome: '👋',
  booking_confirmed: '✅',
  booking_cancelled: '❌',
  new_review: '⭐',
  recommendation: '🤖',
  owner_booking: '📋',
  default: '🔔',
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationCenter() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = (n) => {
    markRead(n.id);
    if (n.link) { setOpen(false); navigate(n.link); }
  };

  return (
    <div className="notif-wrap" ref={ref}>
      <button
        className="notif-bell"
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel__header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={markAllRead}>Mark all read</button>
            )}
          </div>
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <span>🔕</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 20).map(n => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.read ? 'notif-item--unread' : ''} ${n.link ? 'notif-item--clickable' : ''}`}
                  onClick={() => handleClick(n)}
                >
                  <div className="notif-icon">{TYPE_ICON[n.type] || TYPE_ICON.default}</div>
                  <div className="notif-body">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-message">{n.message}</div>
                    <div className="notif-time">{timeAgo(n.createdAt)}</div>
                  </div>
                  {!n.read && <div className="notif-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
