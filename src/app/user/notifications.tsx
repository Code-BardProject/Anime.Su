import { useState, useEffect } from "react";
import { getNotifications } from "../../../services/userApi";

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

const typeColors: Record<Notification['type'], string> = {
  info: '#22d3ee',
  warning: '#fbbf24',
  success: '#4ade80',
  error: '#f87171',
};

const fallbackNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'success',
    title: 'Обновление профиля',
    message: 'Настройки профиля были успешно обновлены.',
    isRead: false,
    createdAt: '2 часа назад',
  },
  {
    id: 'notif-2',
    type: 'info',
    title: 'Новая серия',
    message: 'Вышла новая серия для вашего списка.',
    isRead: true,
    createdAt: 'Вчера',
  },
  {
    id: 'notif-3',
    type: 'warning',
    title: 'Проверка рекомендаций',
    message: 'Мы обновили подборку рекомендаций для вас.',
    isRead: false,
    createdAt: '3 дня назад',
  },
];

export default function Notifications({ onNavigate }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>(fallbackNotifications);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNotifications();
      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications.length ? data.notifications : fallbackNotifications);
        return;
      }

      setNotifications(fallbackNotifications);
    } catch (err) {
      console.error(err);
      setNotifications(fallbackNotifications);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      // Mark as read functionality - needs to be added to userApi
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Mark all as read functionality - needs to be added to userApi
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Delete functionality - needs to be added to userApi
      setNotifications(notifications.filter(n => n.id !== id));
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
        <div className="flex items-center gap-3">
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            УВЕДОМЛЕНИЯ
          </h2>
          {unreadCount > 0 && (
            <span className="px-2 py-1 rounded text-xs" style={{ background: "#a855f7", color: "#fff", fontFamily: "var(--font-mono)" }}>
              {unreadCount} новых
            </span>
          )}
        </div>
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
            Здесь будут отображаться ваши уведомления
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="p-4 rounded transition-all"
              style={{ 
                background: notification.isRead ? "rgba(255,255,255,0.02)" : "rgba(124,58,237,0.08)",
                border: `1px solid ${notification.isRead ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.2)"}`
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ background: typeColors[notification.type] }}
                    />
                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, color: "#e8e8f0" }}>
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: "#a855f7", color: "#fff", fontFamily: "var(--font-mono)" }}>
                        Новое
                      </span>
                    )}
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#a0a0b8", marginBottom: 8 }}>
                    {notification.message}
                  </p>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                    {notification.createdAt}
                  </span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="px-3 py-1.5 rounded text-xs"
                      style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", fontFamily: "var(--font-mono)" }}
                    >
                      ✓
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="px-3 py-1.5 rounded text-xs"
                    style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", fontFamily: "var(--font-mono)" }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
