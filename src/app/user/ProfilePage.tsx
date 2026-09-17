import { useState, useEffect } from "react";
import { animeList, watchlistData } from "../../data/mockData";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../i18n/in8n";
import { database } from "../../../services/database";
import { uploadsApi } from "../../../services/uploadsApi";
import Continue from "./continue";
import History from "./history";
import Notifications from "./notifications";
import Settings from "./settings";
import Thema from "./thema";
import Watchlist from "./watchlist";
import UserweChat from "./userweChat";
import GroupClan from "./groupClan";

interface ProfilePageProps {
  subPage?: string;
  onNavigate: (page: string, data?: unknown) => void;
}

const statusTabs = [
  { key: "watching", label: "watching", emoji: "▶", color: "#22d3ee" },
  { key: "completed", label: "completed", emoji: "✓", color: "#4ade80" },
  { key: "planned", label: "planned", emoji: "📌", color: "#fbbf24" },
  { key: "dropped", label: "dropped", emoji: "✕", color: "#f87171" },
];

const mockHistory = [
  { id: 1, animeId: 1, episode: 12, watchedAt: "Сегодня, 15:42", progress: 18 * 60 + 30 },
  { id: 2, animeId: 2, episode: 8, watchedAt: "Вчера, 20:11", progress: 22 * 60 + 10 },
  { id: 3, animeId: 3, episode: 87, watchedAt: "3 дня назад", progress: 24 * 60 },
  { id: 4, animeId: 5, episode: 28, watchedAt: "5 дней назад", progress: 24 * 60 },
];

const mockNotifications = [
  { id: 1, type: "episode", text: "Вышла 13-я серия «Магическая битва 3»", time: "2 часа назад", read: false, animeId: 1 },
  { id: 2, type: "episode", text: "Вышла 9-я серия «Соло Левелинг 2»", time: "6 часов назад", read: false, animeId: 2 },
  { id: 3, type: "reply", text: "NightOwl_Anime ответил на ваш комментарий", time: "Вчера", read: true, animeId: null },
  { id: 4, type: "system", text: "Добро пожаловать в Anime.Su! Заполните профиль", time: "3 дня назад", read: true, animeId: null },
];

function WatchlistTab({ onNavigate }: { onNavigate: (p: string, d?: unknown) => void }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState("watching");
  const resolvedTabs = statusTabs.map(item => ({ ...item, label: t.profile.watchlist[item.label] }));
  const list = watchlistData.filter(w => w.status === tab).map(w => ({
    ...w, anime: animeList.find(a => a.id === w.animeId),
  })).filter(w => w.anime);

  return (
    <div>
      {/* Status tabs - scrollable on mobile */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {resolvedTabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded transition-all" style={{ background: tab === t.key ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${tab === t.key ? "rgba(124,58,237,0.35)" : "rgba(255,255,255,0.06)"}`, color: tab === t.key ? t.color : "#6b6b8a", fontFamily: "var(--font-display)", fontSize: 13, fontWeight: tab === t.key ? 700 : 400, letterSpacing: "0.05em" }}>
            <span style={{ fontSize: 12 }}>{t.emoji}</span>
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {list.length === 0 && (
          <div className="py-12 text-center">
            <p style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "#a855f7", marginBottom: 8 }}>空</p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "#6b6b8a", letterSpacing: "0.06em" }}>СПИСОК ПУСТ</p>
          </div>
        )}
        {list.map(({ anime, progress, total }) => anime && (
          <div key={anime.id} className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded cursor-pointer transition-all" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.08)" }}
            onClick={() => onNavigate("anime", anime)}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.06)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
          >
            <img src={anime.cover} alt={anime.title} className="w-12 h-16 sm:w-14 sm:h-20 object-cover rounded flex-shrink-0" style={{ border: "1px solid rgba(124,58,237,0.2)" }} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate" style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "#e8e8f0", letterSpacing: "0.03em" }}>{anime.title}</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", marginTop: 2 }}>{anime.studio} · {anime.year}</p>
              <div className="mt-2 sm:mt-3 flex items-center gap-2 sm:gap-3">
                <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-1 rounded-full transition-all" style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%`, background: "linear-gradient(to right,#7c3aed,#a855f7)" }} />
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", flexShrink: 0 }}>{progress}/{total} эп.</span>
              </div>
            </div>
            {anime.score > 0 && (
              <div className="hidden sm:flex items-start gap-1 flex-shrink-0 pt-1">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="#fbbf24" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#fbbf24" }}>{anime.score}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryTab({ onNavigate }: { onNavigate: (p: string, d?: unknown) => void }) {
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return (
    <div className="space-y-3">
      {mockHistory.map(h => {
        const anime = animeList.find(a => a.id === h.animeId);
        if (!anime) return null;
        return (
          <div key={h.id} className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded cursor-pointer transition-all" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.08)" }}
            onClick={() => onNavigate("anime", anime)}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.06)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
          >
            <div className="relative flex-shrink-0">
              <img src={anime.cover} alt={anime.title} className="w-12 h-16 sm:w-16 sm:h-22 object-cover rounded" />
              <div className="absolute inset-0 flex items-center justify-center rounded" style={{ background: "rgba(0,0,0,0.3)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(168,85,247,0.9)" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate" style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "#e8e8f0" }}>{anime.title}</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#a855f7", marginTop: 2 }}>Серия {h.episode}</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", marginTop: 1 }}>
                {h.progress >= 24 * 60 ? "Просмотрено полностью" : `Просмотрено до ${fmt(h.progress)}`}
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a" }}>{h.watchedAt}</p>
              <button className="mt-2 px-3 py-1 rounded text-xs" style={{ background: "rgba(124,58,237,0.12)", color: "#a855f7", fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}>
                Продолжить
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NotificationsTab({ onNavigate }: { onNavigate: (p: string, d?: unknown) => void }) {
  const [notifs, setNotifs] = useState(mockNotifications);
  const markAll = () => setNotifs(n => n.map(x => ({ ...x, read: true })));
  const unread = notifs.filter(n => !n.read).length;

  const icons: Record<string, string> = { episode: "🎬", reply: "💬", system: "🔔" };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>
          {unread > 0 ? <span style={{ color: "#a855f7" }}>{unread} непрочитанных</span> : "Всё прочитано"}
        </p>
        {unread > 0 && <button onClick={markAll} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#a855f7" }}>Прочитать все</button>}
      </div>
      <div className="space-y-2">
        {notifs.map(n => (
          <div
            key={n.id}
            className="flex items-start gap-3 p-4 rounded transition-all cursor-pointer"
            style={{ background: n.read ? "rgba(255,255,255,0.02)" : "rgba(124,58,237,0.07)", border: `1px solid ${n.read ? "rgba(255,255,255,0.05)" : "rgba(124,58,237,0.2)"}` }}
            onClick={() => {
              setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
              if (n.animeId) { const a = animeList.find(x => x.id === n.animeId); if (a) onNavigate("anime", a); }
            }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: n.read ? "rgba(255,255,255,0.05)" : "rgba(124,58,237,0.15)" }}>
              <span style={{ fontSize: 16 }}>{icons[n.type]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: n.read ? "#a0a0b8" : "#e8e8f0", lineHeight: 1.5 }}>{n.text}</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", marginTop: 3 }}>{n.time}</p>
            </div>
            {!n.read && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: "#a855f7" }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsTab({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { user, updateUser, logout } = useAuth();
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [quality, setQuality] = useState("1080p");
  const [theme, setTheme] = useState("dark");
  const [autoplay, setAutoplay] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setUploadProgress(0);

    try {
      const result = await uploadsApi.uploadAvatar(file, (progress) => {
        setUploadProgress(progress.percentage);
      });

      if (result.success && result.data?.url) {
        updateUser({ avatar: result.data.url });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        console.error('Avatar upload failed:', result.error);
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
    } finally {
      setUploadingAvatar(false);
      setUploadProgress(0);
    }
  };

  const save = () => {
    updateUser({ username, email });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const Field = ({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
    <div>
      <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        className="mt-1.5 w-full px-4 py-2.5 rounded outline-none transition-all"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.2)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
        onFocus={e => (e.target.style.borderColor = "rgba(168,85,247,0.5)")}
        onBlur={e => (e.target.style.borderColor = "rgba(124,58,237,0.2)")}
      />
    </div>
  );

  const Toggle = ({ label, sub, value, onChange }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "#e8e8f0", letterSpacing: "0.03em" }}>{label}</p>
        {sub && <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", marginTop: 1 }}>{sub}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative w-12 h-6 rounded-full transition-all flex-shrink-0"
        style={{ background: value ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "rgba(255,255,255,0.1)" }}
      >
        <div className="absolute top-0.5 transition-all w-5 h-5 rounded-full bg-white" style={{ left: value ? 26 : 2, boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
      </button>
    </div>
  );

  return (
    <div className="max-w-xl space-y-8">
      {/* Profile */}
      <section>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Профиль</h3>
        <div className="space-y-4">
          {/* Avatar Upload */}
          <div>
            <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>Аватар</label>
            <div className="mt-2 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", border: "2px solid rgba(168,85,247,0.5)" }}>
                {user?.avatar && user.avatar.startsWith('http') ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "#fff" }}>{user?.avatar || user?.username?.[0]?.toUpperCase() || "U"}</span>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  className="hidden"
                />
                <label
                  htmlFor="avatar-upload"
                  className="inline-block px-4 py-2 rounded cursor-pointer transition-all text-sm"
                  style={{
                    background: uploadingAvatar ? "rgba(124,58,237,0.3)" : "rgba(124,58,237,0.1)",
                    border: "1px solid rgba(124,58,237,0.3)",
                    color: "#a855f7",
                    fontFamily: "var(--font-display)",
                    letterSpacing: "0.04em"
                  }}
                >
                  {uploadingAvatar ? `Загрузка ${uploadProgress.toFixed(0)}%` : "Загрузить аватар"}
                </label>
                {uploadingAvatar && (
                  <div className="mt-2 h-1 rounded-full" style={{ background: "rgba(124,58,237,0.2)" }}>
                    <div className="h-1 rounded-full transition-all" style={{ width: `${uploadProgress}%`, background: "linear-gradient(to right,#7c3aed,#a855f7)" }} />
                  </div>
                )}
              </div>
            </div>
          </div>
          <Field label="Никнейм" value={username} onChange={setUsername} />
          <Field label="Email" type="email" value={email} onChange={setEmail} />
        </div>
      </section>

      {/* Video */}
      <section>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Видео</h3>
        <div>
          <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>Качество по умолчанию</label>
          <div className="mt-2 flex gap-2 flex-wrap">
            {["360p", "480p", "720p", "1080p", "Авто"].map(q => (
              <button key={q} onClick={() => setQuality(q)} className="px-4 py-2 rounded transition-all" style={{ background: quality === q ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${quality === q ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.08)"}`, color: quality === q ? "#a855f7" : "#a0a0b8", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                {q}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <Toggle label="Автовоспроизведение" sub="Следующая серия запускается автоматически" value={autoplay} onChange={setAutoplay} />
        </div>
      </section>

      {/* Interface */}
      <section>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Интерфейс</h3>
        <div>
          <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>Тема</label>
          <div className="mt-2 flex gap-2">
            {[["dark","Тёмная"],["light","Светлая"],["auto","Авто"]].map(([v, l]) => (
              <button key={v} onClick={() => setTheme(v)} className="px-4 py-2 rounded transition-all" style={{ background: theme === v ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${theme === v ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.08)"}`, color: theme === v ? "#a855f7" : "#a0a0b8", fontFamily: "var(--font-display)", fontSize: 12 }}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <Toggle label="Уведомления" sub="Новые серии из вашего списка" value={notifications} onChange={setNotifications} />
        </div>
      </section>

      {/* Privacy */}
      <section>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Приватность</h3>
        <div className="space-y-2">
          {["Закрытый профиль", "Скрыть историю просмотров", "Скрыть списки"].map(label => (
            <Toggle key={label} label={label} value={false} onChange={() => {}} />
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={save} className="flex-1 py-3 rounded font-semibold transition-all" style={{ background: saved ? "rgba(74,222,128,0.15)" : "linear-gradient(135deg,#7c3aed,#a855f7)", border: saved ? "1px solid rgba(74,222,128,0.4)" : "none", color: saved ? "#4ade80" : "#fff", fontFamily: "var(--font-display)", fontSize: 14, letterSpacing: "0.08em" }}>
          {saved ? "✓ СОХРАНЕНО" : "СОХРАНИТЬ"}
        </button>
        <button onClick={() => { logout(); onNavigate("home"); }} className="flex-1 py-3 rounded font-semibold transition-all" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", fontFamily: "var(--font-display)", fontSize: 14, letterSpacing: "0.08em" }}>
          ВЫЙТИ ИЗ АККАУНТА
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage({ subPage, onNavigate }: ProfilePageProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const active = subPage ?? "watchlist";

  // Load anime from database to ensure newly added anime appears in profile
  useEffect(() => {
    let isMounted = true;

    const loadAnimeFromDatabase = async () => {
      try {
        console.log('Loading anime from database for profile page...');
        const result = await database.loadAnimeFromDatabase();
        
        if (isMounted && result.success && result.data) {
          console.log('Successfully loaded anime for profile:', result.data.length, 'items');
        } else {
          console.warn('Failed to load anime for profile:', result.error);
        }
      } catch (error) {
        console.warn('Profile anime sync failed:', error);
      }
    };

    loadAnimeFromDatabase();

    return () => {
      isMounted = false;
    };
  }, []);

  const tabs = [
    { id: "continue", label: t.profile.tabs.continue, emoji: "▶" },
    { id: "watchlist", label: t.profile.tabs.watchlist, emoji: "📋" },
    { id: "history", label: t.profile.tabs.history, emoji: "🕐" },
    { id: "notifications", label: t.profile.tabs.notifications, emoji: "🔔" },
    { id: "settings", label: t.profile.tabs.settings, emoji: "⚙️" },
    { id: "thema", label: t.profile.tabs.thema, emoji: "🎨" },
    { id: "chat", label: t.profile.tabs.chat, emoji: "💬" },
    { id: "groups", label: t.profile.tabs.groups, emoji: "👥" },
  ];

  if (!user) {
    return (
      <div className="min-h-screen pt-14 flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="text-center px-4">
          <p style={{ fontSize: 48, marginBottom: 16 }}>🔒</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{t.profile.authRequiredTitle}</h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#6b6b8a", marginBottom: 24 }}>{t.profile.authRequiredText}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => onNavigate("login")} className="px-6 py-3 rounded" style={{ border: "1px solid rgba(124,58,237,0.4)", color: "#a855f7", fontFamily: "var(--font-display)", fontSize: 14, letterSpacing: "0.06em" }}>{t.auth.login.toUpperCase()}</button>
            <button onClick={() => onNavigate("register")} className="px-6 py-3 rounded" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", fontFamily: "var(--font-display)", fontSize: 14, letterSpacing: "0.06em" }}>{t.auth.register.toUpperCase()}</button>
          </div>
        </div>
      </div>
    );
  }

  const unreadCount = mockNotifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen pt-14" style={{ background: "var(--background)" }}>
      {/* Cover */}
      <div className="relative overflow-hidden" style={{ height: 180 }}>
        <img src="https://images.unsplash.com/photo-1670960618864-93ad2f92a81c?w=1280&h=200&fit=crop&auto=format" alt="Cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,10,15,0.1), rgba(10,10,15,0.95))" }} />
      </div>

      <div className="px-4 sm:px-8 md:px-16 -mt-14 relative z-10">
        {/* Avatar + Info */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-end mb-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", border: "3px solid rgba(168,85,247,0.5)", boxShadow: "0 0 24px rgba(124,58,237,0.5)" }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "#fff" }}>{user.avatar}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(20px,4vw,28px)", color: "#e8e8f0", letterSpacing: "0.06em", textTransform: "uppercase" }}>{user.username}</h1>
              {user.isPremium && <span className="px-2 py-0.5 rounded text-xs" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>PREMIUM</span>}
              {user.role !== "USER" && <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", fontFamily: "var(--font-mono)", border: "1px solid rgba(248,113,113,0.3)" }}>{user.role}</span>}
            </div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a", marginTop: 3 }}>На сайте с {user.joinDate}</p>
          </div>
          <div className="flex gap-4 sm:gap-6">
            {[["▶", user.stats.watching, "#22d3ee", "Смотрю"], ["✓", user.stats.completed, "#4ade80", "Завершено"], ["📌", user.stats.planned, "#fbbf24", "Планирую"]].map(([icon, count, color, label]) => (
              <div key={label as string} className="text-center">
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: color as string }}>{count}</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#6b6b8a", textTransform: "uppercase" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 overflow-x-auto mb-8" style={{ borderBottom: "1px solid rgba(124,58,237,0.15)", paddingBottom: 0 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => onNavigate(`profile/${t.id}`)}
              className="flex items-center gap-1.5 px-3 sm:px-5 py-3 flex-shrink-0 transition-all relative"
              style={{
                fontFamily: "var(--font-display)", fontSize: 13, fontWeight: active === t.id ? 700 : 400,
                color: active === t.id ? "#a855f7" : "#6b6b8a", letterSpacing: "0.06em", textTransform: "uppercase",
                borderBottom: active === t.id ? "2px solid #a855f7" : "2px solid transparent", marginBottom: -1,
              }}
            >
              <span className="hidden sm:inline">{t.emoji}</span>
              {t.label}
              {t.id === "notifications" && unreadCount > 0 && (
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs" style={{ background: "#a855f7", color: "#fff", fontFamily: "var(--font-mono)", fontSize: 9 }}>{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="pb-12">
          {active === "continue" && <Continue onNavigate={onNavigate} />}
          {active === "watchlist" && <Watchlist onNavigate={onNavigate} />}
          {active === "history" && <History onNavigate={onNavigate} />}
          {active === "notifications" && <Notifications onNavigate={onNavigate} />}
          {active === "settings" && <Settings onNavigate={onNavigate} />}
          {active === "thema" && <Thema onNavigate={onNavigate} />}
          {active === "chat" && <UserweChat onNavigate={onNavigate} />}
          {active === "groups" && <GroupClan onNavigate={onNavigate} />}
        </div>
      </div>
    </div>
  );
}
