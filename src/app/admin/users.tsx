import { useState, useEffect } from "react";
import { adminApi } from "../../../services/adminApi";

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  phone?: string;
  country?: string;
}

interface UsersProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const roleColors: Record<string, string> = {
  user: '#a855f7',
};

const statusColors: Record<string, string> = {
  active: '#4ade80',
  blocked: '#f87171',
  pending: '#fbbf24',
  banned: '#f87171',
};

const normalizeRole = (role?: string) => {
  const value = String(role || 'user').trim().toLowerCase();
  return ['admin', 'moderator', 'teacher', 'student', 'parent'].includes(value) ? 'user' : value || 'user';
};

const normalizeStatus = (status?: string) => {
  const value = String(status || 'active').trim().toLowerCase();
  if (['banned', 'blocked'].includes(value)) return 'blocked';
  return ['active', 'pending'].includes(value) ? value : 'active';
};

export default function Users({ onNavigate }: UsersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, [search]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminApi.getUsers(search);
      if (result.success) {
        setUsers((result.users || result.data || []) as User[]);
      } else {
        throw new Error(result.error || "Не удалось загрузить пользователей");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки пользователей");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
      setShowBulkActions(true);
    }
  };

  const handleUpdateUser = async (userId: string, updates: { status?: string; role?: string }) => {
    try {
      const nextRole = updates.role ? normalizeRole(updates.role) : undefined;
      const nextStatus = updates.status ? normalizeStatus(updates.status) : undefined;
      const normalizedUpdates = {
        ...(nextRole ? { role: nextRole } : {}),
        ...(nextStatus ? { status: nextStatus } : {}),
      };
      const result = await adminApi.updateUser(userId, {
        ...(nextRole ? { role: nextRole } : {}),
        ...(nextStatus ? { status: nextStatus } : {}),
      });
      if (result.success) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, ...normalizedUpdates } : u
        ));
      }
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  const handleSendEmail = async (email: string) => {
    try {
      const result = await adminApi.resendVerificationEmail(email);
      if (!result.success) {
        throw new Error(result.error || 'Не удалось отправить письмо');
      }
      setError(null);
    } catch (err) {
      console.error('Failed to send email:', err);
      setError(err instanceof Error ? err.message : 'Не удалось отправить письмо');
    }
  };

  const openUserPage = (user: User) => {
    setSelectedUser(user);
  };

  const closeUserPage = () => {
    setSelectedUser(null);
  };

  const handleBulkAction = async (action: 'ban' | 'activate' | 'delete') => {
    try {
      const promises = Array.from(selectedUsers).map(userId => {
        if (action === 'delete') {
          // Delete logic if needed
          return Promise.resolve();
        }
        return handleUpdateUser(userId, { 
          status: action === 'ban' ? 'banned' : 'active' 
        });
      });
      
      await Promise.all(promises);
      setSelectedUsers(new Set());
      setShowBulkActions(false);
      loadUsers();
    } catch (err) {
      console.error('Bulk action failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>Загрузка пользователей...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-6xl mb-4">⚠️</div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#f87171", marginBottom: 12 }}>{error}</p>
        <button
          onClick={loadUsers}
          className="px-6 py-3 rounded-lg text-sm font-semibold transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", fontFamily: "var(--font-display)" }}
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div>
      {selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: "rgba(0,0,0,0.76)", backdropFilter: "blur(4px)" }} onClick={closeUserPage}>
          <div className="w-full max-w-4xl rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.25)", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }} onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(124,58,237,0.2)" }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff" }}>
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt={selectedUser.username} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold">{selectedUser.username?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "#e8e8f0" }}>{selectedUser.username}</p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>{selectedUser.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSendEmail(selectedUser.email)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: "rgba(124,58,237,0.15)", color: "#a855f7", border: "1px solid rgba(124,58,237,0.28)", fontFamily: "var(--font-display)" }}
                >
                  Send email
                </button>
                <button
                  onClick={() => handleUpdateUser(selectedUser.id, { status: 'blocked' })}
                  className="px-4 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: "rgba(248,113,113,0.14)", color: "#f87171", border: "1px solid rgba(248,113,113,0.28)", fontFamily: "var(--font-display)" }}
                >
                  Заблокировать
                </button>
                <button
                  onClick={closeUserPage}
                  className="px-4 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: "rgba(255,255,255,0.04)", color: "#a0a0b8", border: "1px solid rgba(124,58,237,0.22)", fontFamily: "var(--font-display)" }}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.08)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", textTransform: "uppercase" }}>Роль</p>
                  <span className="mt-2 inline-block px-3 py-2 rounded text-xs" style={{ background: `${roleColors.user}20`, color: roleColors.user, border: `1px solid ${roleColors.user}40` }}>
                    User
                  </span>
                </div>
                <div className="rounded p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.08)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", textTransform: "uppercase" }}>Статус</p>
                  <select
                    value={normalizeStatus(selectedUser.status)}
                    onChange={(e) => handleUpdateUser(selectedUser.id, { status: e.target.value })}
                    className="mt-2 px-3 py-2 rounded-lg text-xs outline-none transition-all cursor-pointer"
                    style={{ background: `${statusColors[normalizeStatus(selectedUser.status)] || '#6b6b8a'}20`, color: statusColors[normalizeStatus(selectedUser.status)] || '#6b6b8a', fontFamily: "var(--font-display)", border: `1px solid ${statusColors[normalizeStatus(selectedUser.status)] || '#6b6b8a'}40` }}
                  >
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div className="rounded p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.08)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", textTransform: "uppercase" }}>Дата регистрации</p>
                  <p className="mt-2" style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "#e8e8f0" }}>{new Date(selectedUser.createdAt).toLocaleDateString('ru-RU')}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.08)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", textTransform: "uppercase" }}>Телефон</p>
                  <p className="mt-2" style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#a0a0b8" }}>{selectedUser.phone || '—'}</p>
                </div>
                <div className="rounded p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.08)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", textTransform: "uppercase" }}>Страна</p>
                  <p className="mt-2" style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#a0a0b8" }}>{selectedUser.country || '—'}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded p-4" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(124,58,237,0.1)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <p style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "#e8e8f0", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>История просмотра</p>
                    <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "#6b6b8a" }}>3</span>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded p-2" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.1)" }}>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#a0a0b8" }}>Solo Leveling</span>
                    </div>
                    <div className="rounded p-2" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.1)" }}>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#a0a0b8" }}>Frieren</span>
                    </div>
                    <div className="rounded p-2" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.1)" }}>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#a0a0b8" }}>Vinland Saga</span>
                    </div>
                  </div>
                </div>

                <div className="rounded p-4" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(124,58,237,0.1)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <p style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "#e8e8f0", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Подписки</p>
                    <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "#6b6b8a" }}>2</span>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded p-2" style={{ background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.1)" }}>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#a0a0b8" }}>Сериалы: Onboarding</span>
                    </div>
                    <div className="rounded p-2" style={{ background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.1)" }}>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#a0a0b8" }}>Расписание новых серий</span>
                    </div>
                  </div>
                </div>

                <div className="rounded p-4" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(124,58,237,0.1)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <p style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "#e8e8f0", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>События</p>
                    <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "#6b6b8a" }}>4</span>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded p-2" style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.1)" }}>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#a0a0b8" }}>Зарегистрирован</span>
                    </div>
                    <div className="rounded p-2" style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.1)" }}>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#a0a0b8" }}>Смена статуса: Pending</span>
                    </div>
                    <div className="rounded p-2" style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.1)" }}>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#a0a0b8" }}>Пользователь просмотрел каталог</span>
                    </div>
                  </div>
                </div>

                <div className="rounded p-4" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(124,58,237,0.1)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <p style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "#e8e8f0", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Уведомления</p>
                    <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "#6b6b8a" }}>1</span>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded p-2" style={{ background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.1)" }}>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#a0a0b8" }}>Сервисное письмо отправлено</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
            👥 ПОЛЬЗОВАТЕЛИ
          </h2>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>
            Всего: {users.length} пользователей
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по email или username..."
            className="w-full md:w-80 px-4 py-3 pl-12 rounded-xl outline-none transition-all"
            style={{ 
              background: "rgba(255,255,255,0.04)", 
              border: "1px solid rgba(124,58,237,0.25)", 
              color: "#e8e8f0", 
              fontFamily: "var(--font-body)", 
              fontSize: 14 
            }}
          />
          <svg 
            className="absolute left-4 top-1/2 -translate-y-1/2" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#6b6b8a" 
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="mb-6 p-4 rounded-xl flex items-center justify-between" style={{ 
          background: "rgba(124,58,237,0.1)", 
          border: "1px solid rgba(124,58,237,0.3)" 
        }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "#e8e8f0" }}>
            Выбрано: {selectedUsers.size} пользователей
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('activate')}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
              style={{ background: "rgba(74,222,128,0.2)", color: "#4ade80", fontFamily: "var(--font-display)" }}
            >
              Активировать
            </button>
            <button
              onClick={() => handleBulkAction('ban')}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
              style={{ background: "rgba(248,113,113,0.2)", color: "#f87171", fontFamily: "var(--font-display)" }}
            >
              Заблокировать
            </button>
            <button
              onClick={() => setSelectedUsers(new Set())}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
              style={{ background: "rgba(255,255,255,0.1)", color: "#6b6b8a", fontFamily: "var(--font-display)" }}
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-2xl" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
          <div className="text-6xl mb-4">👥</div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#e8e8f0", letterSpacing: "0.1em" }}>
            НЕТ ПОЛЬЗОВАТЕЛЕЙ
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a", marginTop: 8 }}>
            {search ? "По вашему запросу ничего не найдено" : "Пользователи появятся здесь после регистрации"}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center" style={{ background: "rgba(124,58,237,0.08)", borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
            <div className="col-span-1">
              <input
                type="checkbox"
                checked={selectedUsers.size === users.length}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded cursor-pointer"
                style={{ accentColor: "#a855f7" }}
              />
            </div>
            <div className="col-span-3" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Пользователь
            </div>
            <div className="col-span-2" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Роль
            </div>
            <div className="col-span-2" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Статус
            </div>
            <div className="col-span-2" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Email
            </div>
            <div className="col-span-2" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Дата регистрации
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {users.map((user, index) => (
              <div
                key={user.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center transition-all hover:bg-purple-500/5 cursor-pointer"
                style={{ background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}
                onClick={() => openUserPage(user)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openUserPage(user);
                  }
                }}
              >
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                    className="w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: "#a855f7" }}
                  />
                </div>
                
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ 
                    background: `linear-gradient(135deg, ${roleColors[user.role] || '#a855f7'}, ${roleColors[user.role] || '#a855f7'}80)`,
                    color: "#fff"
                  }}>
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      user.username?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "#e8e8f0", fontWeight: 600 }}>
                      {user.username}
                    </p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                      {user.phone || user.country || '—'}
                    </p>
                  </div>
                </div>

                <div className="col-span-2">
                  <span
                    className="px-3 py-2 rounded-lg text-xs"
                    style={{
                      background: `${roleColors.user}20`,
                      color: roleColors.user,
                      fontFamily: "var(--font-display)",
                      border: `1px solid ${roleColors.user}40`,
                      display: "inline-block",
                    }}
                  >
                    User
                  </span>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: statusColors[normalizeStatus(user.status)] || '#6b6b8a' }} />
                    <select
                      value={normalizeStatus(user.status)}
                      onChange={(e) => handleUpdateUser(user.id, { status: e.target.value })}
                      className="px-3 py-2 rounded-lg text-xs outline-none transition-all cursor-pointer"
                      style={{ 
                        background: `${statusColors[normalizeStatus(user.status)] || '#6b6b8a'}20`, 
                        color: statusColors[normalizeStatus(user.status)] || '#6b6b8a', 
                        fontFamily: "var(--font-display)",
                        border: `1px solid ${statusColors[normalizeStatus(user.status)] || '#6b6b8a'}40`
                      }}
                    >
                      <option value="active">Active</option>
                      <option value="blocked">Blocked</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>

                <div className="col-span-1">
                  <div className="flex items-center gap-2">
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#a0a0b8" }}>
                      {user.email}
                    </p>
                    {user.emailVerified && (
                      <span className="text-xs">✅</span>
                    )}
                  </div>
                </div>

                <div className="col-span-1">
                  <button
                    type="button"
                    onClick={() => handleSendEmail(user.email)}
                    className="px-3 py-2 rounded-lg text-xs transition-all hover:scale-105"
                    style={{
                      background: "rgba(124,58,237,0.12)",
                      color: "#a855f7",
                      fontFamily: "var(--font-mono)",
                      border: "1px solid rgba(124,58,237,0.25)",
                    }}
                  >
                    Send email
                  </button>
                </div>

                <div className="col-span-1">
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                    {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}