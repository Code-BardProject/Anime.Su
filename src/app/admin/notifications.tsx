import { useState, useEffect } from "react";
import { adminApi } from "../../../services/adminApi";
import { database } from "../../../services/database";
import { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from "../../../services/userApi";

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const notificationColors: Record<Notification['type'], string> = {
  info: '#22d3ee',
  warning: '#fbbf24',
  success: '#4ade80',
  error: '#f87171',
};

const notificationIcons: Record<Notification['type'], string> = {
  info: 'ℹ️',
  warning: '⚠️',
  success: '✅',
  error: '❌',
};

export default function Notifications({ onNavigate }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previousUnread, setPreviousUnread] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getNotifications();
      if (data.success) {
        const nextNotifications = (data.notifications || data.data || []) as Notification[];
        const nextUnread = nextNotifications.filter((notification) => !notification.isRead).length;
        if (nextUnread > previousUnread) {
          const sound = new Audio("/assets/notifications/bell-notification.wav");
          void sound.play().catch(() => undefined);
        }
        setPreviousUnread(nextUnread);
        setNotifications(nextNotifications);
      } else {
        console.warn('Notifications load failed:', data.error || 'Failed to load');
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(timer);
  }, [previousUnread]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const result = await markNotificationAsRead(id);
      if (result.success) {
        setNotifications(notifications.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        ));
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await markAllNotificationsAsRead();
      if (result.success) {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteNotification(id);
      if (result.success) {
        setNotifications(notifications.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#f87171", marginBottom: 12 }}>{error}</p>
        <button
          onClick={loadNotifications}
          className="px-4 py-2 rounded text-sm"
          style={{ background: "rgba(124,58,237,0.1)", color: "#a855f7", fontFamily: "var(--font-display)" }}
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          УВЕДОМЛЕНИЯ
          {unreadCount > 0 && (
            <span className="ml-3 px-2 py-1 rounded text-xs" style={{ background: "rgba(168,85,247,0.2)", color: "#a855f7", fontFamily: "var(--font-mono)" }}>
              {unreadCount} новых
            </span>
          )}
        </h2>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 rounded text-sm"
            style={{ background: "rgba(124,58,237,0.1)", color: "#a855f7", fontFamily: "var(--font-display)" }}
          >
            Отметить все как прочитанные
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64">
          <p style={{ fontFamily: "var(--font-display)", fontSize: 48, marginBottom: 16 }}>🔔</p>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#e8e8f0", letterSpacing: "0.1em" }}>
            НЕТ УВЕДОМЛЕНИЙ
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a", marginTop: 8 }}>
            Здесь будут отображаться уведомления
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="p-4 rounded transition-all"
              style={{
                background: notification.isRead ? "var(--card)" : "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.12)",
                opacity: notification.isRead ? 0.7 : 1
              }}
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl">{notificationIcons[notification.type]}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 style={{ 
                      fontFamily: "var(--font-display)", 
                      fontWeight: 600, 
                      fontSize: 14, 
                      color: notificationColors[notification.type] 
                    }}>
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <span className="w-2 h-2 rounded-full" style={{ background: "#a855f7" }} />
                    )}
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#a0a0b8", marginBottom: 8 }}>
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                      {notification.createdAt}
                    </span>
                    <div className="flex gap-2">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="px-3 py-1 rounded text-xs transition-all"
                          style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", fontFamily: "var(--font-mono)" }}
                        >
                          Прочитать
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="px-3 py-1 rounded text-xs transition-all"
                        style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", fontFamily: "var(--font-mono)" }}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
