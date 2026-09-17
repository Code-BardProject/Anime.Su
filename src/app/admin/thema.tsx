import { useState, useEffect } from "react";
import { adminApi } from "../../../services/adminApi";

interface Theme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  cardBackground: string;
  isActive: boolean;
}

interface ThemaProps {
  onNavigate: (page: string, data?: unknown) => void;
}

export default function Thema({ onNavigate }: ThemaProps) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [activeTheme, setActiveThemeState] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTheme, setNewTheme] = useState<Partial<Theme>>({
    name: '',
    primaryColor: '#7c3aed',
    secondaryColor: '#a855f7',
    backgroundColor: '#0d0d14',
    textColor: '#e8e8f0',
    cardBackground: '#13131c',
  });

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      setLoading(true);
      setError(null);
      const [themesData, activeData] = await Promise.all([
        adminApi.getThemes(),
        adminApi.getActiveTheme(),
      ]);
      if (themesData.success && activeData.success) {
        const loadedThemes = Array.isArray(themesData.themes) ? themesData.themes as Theme[] : [];
        setThemes(loadedThemes);
        const active = activeData.theme ? activeData.theme as Theme : null;
        setActiveThemeState(active);
        if (active) {
          setThemes((current) => current.map((theme) => ({ ...theme, isActive: theme.id === active.id })));
        }
      } else {
        console.warn('Themes load failed:', themesData.error || activeData.error || 'Failed to load themes');
        setThemes([]);
        setActiveThemeState(null);
      }
    } catch (err) {
      console.error('Failed to load themes:', err);
      setThemes([]);
      setActiveThemeState(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      setSaving(true);
      const result = await adminApi.setActiveTheme(id);
      if (!result.success && !result.result?.success && !result.theme && !result.data) {
        throw new Error(result.error || 'Failed to activate theme');
      }
      const activeData = await adminApi.getActiveTheme();
      if (activeData.success || activeData.theme || activeData.data) {
        const selectedTheme = (activeData.theme || activeData.data?.theme || activeData.data || null) as Theme | null;
        if (selectedTheme) {
          setActiveThemeState(selectedTheme);
        } else {
          const fallback = themes.find((theme) => theme.id === id) || null;
          setActiveThemeState(fallback);
        }
        setThemes((current) => current.map((t) => ({ ...t, isActive: t.id === id })));
      }
    } catch (err) {
      console.error('Failed to set active theme:', err);
      setError(err instanceof Error ? err.message : 'Failed to set active theme');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту тему?')) return;
    
    try {
      setSaving(true);
      const result = await adminApi.deleteTheme(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete theme');
      }
      setThemes((current) => current.filter((t) => t.id !== id));
      if (activeTheme?.id === id) {
        setActiveThemeState(null);
      }
    } catch (err) {
      console.error('Failed to delete theme:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete theme');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    try {
      setSaving(true);
      const payload = {
        name: newTheme.name || 'New Theme',
        primaryColor: newTheme.primaryColor || '#7c3aed',
        secondaryColor: newTheme.secondaryColor || '#a855f7',
        backgroundColor: newTheme.backgroundColor || '#0d0d14',
        textColor: newTheme.textColor || '#e8e8f0',
        cardBackground: newTheme.cardBackground || '#13131c',
      };
      const result = await adminApi.createTheme(payload);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create theme');
      }
      const created: Theme = {
        id: String(result.data?.id || result.data?._id || `theme-${Date.now()}`),
        name: String(result.data?.name || payload.name),
        primaryColor: String(result.data?.primaryColor || payload.primaryColor),
        secondaryColor: String(result.data?.secondaryColor || payload.secondaryColor),
        backgroundColor: String(result.data?.backgroundColor || payload.backgroundColor),
        textColor: String(result.data?.textColor || payload.textColor),
        cardBackground: String(result.data?.cardBackground || payload.cardBackground),
        isActive: false,
      };
      setThemes((current) => [...current, created]);
      setShowCreateModal(false);
      setNewTheme({
        name: '',
        primaryColor: '#7c3aed',
        secondaryColor: '#a855f7',
        backgroundColor: '#0d0d14',
        textColor: '#e8e8f0',
        cardBackground: '#13131c',
      });
    } catch (err) {
      console.error('Failed to create theme:', err);
      setError(err instanceof Error ? err.message : 'Failed to create theme');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#f87171", marginBottom: 12 }}>{error}</p>
        <button
          onClick={loadThemes}
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
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            ТЕМЫ
          </h2>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a", marginTop: 4 }}>
            {activeTheme ? `Активная: ${activeTheme.name}` : 'Список тем'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", fontFamily: "var(--font-display)" }}
        >
          + Создать тему
        </button>
      </div>

      {themes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-2xl" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 48, marginBottom: 16 }}>🎨</p>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#e8e8f0", letterSpacing: "0.1em" }}>
            НЕТ ТЕМ
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a", marginTop: 8 }}>
            Создайте первую тему для кастомизации интерфейса
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes.map((theme) => (
            <div
              key={theme.id}
              className="rounded overflow-hidden transition-all hover:scale-[1.02]"
              style={{ 
                background: theme.cardBackground, 
                border: theme.isActive ? "2px solid #a855f7" : "1px solid rgba(124,58,237,0.12)",
                position: 'relative'
              }}
            >
              {theme.isActive && (
                <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs" style={{ background: "#a855f7", color: "#fff", fontFamily: "var(--font-mono)" }}>
                  Активна
                </div>
              )}
              <div className="p-4">
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: theme.textColor, marginBottom: 12 }}>
                  {theme.name}
                </h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded" style={{ background: theme.primaryColor }} />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>Основной</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded" style={{ background: theme.secondaryColor }} />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>Вторичный</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded" style={{ background: theme.backgroundColor }} />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>Фон</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded" style={{ background: theme.textColor }} />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>Текст</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!theme.isActive && (
                    <button
                      onClick={() => handleSetActive(theme.id)}
                      className="flex-1 py-2 rounded text-xs transition-all"
                      style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", fontFamily: "var(--font-mono)" }}
                    >
                      Активировать
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(theme.id)}
                    className="flex-1 py-2 rounded text-xs transition-all"
                    style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", fontFamily: "var(--font-mono)" }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded p-6 w-full max-w-md" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.2)" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
              СОЗДАТЬ ТЕМУ
            </h3>
            <div className="space-y-4">
              <div>
                <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                  Название
                </label>
                <input
                  type="text"
                  value={newTheme.name}
                  onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value })}
                  className="w-full px-4 py-3 rounded outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                    Основной цвет
                  </label>
                  <input
                    type="color"
                    value={newTheme.primaryColor}
                    onChange={(e) => setNewTheme({ ...newTheme, primaryColor: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                    style={{ border: "1px solid rgba(124,58,237,0.25)" }}
                  />
                </div>
                <div>
                  <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                    Вторичный цвет
                  </label>
                  <input
                    type="color"
                    value={newTheme.secondaryColor}
                    onChange={(e) => setNewTheme({ ...newTheme, secondaryColor: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                    style={{ border: "1px solid rgba(124,58,237,0.25)" }}
                  />
                </div>
                <div>
                  <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                    Фон
                  </label>
                  <input
                    type="color"
                    value={newTheme.backgroundColor}
                    onChange={(e) => setNewTheme({ ...newTheme, backgroundColor: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                    style={{ border: "1px solid rgba(124,58,237,0.25)" }}
                  />
                </div>
                <div>
                  <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                    Текст
                  </label>
                  <input
                    type="color"
                    value={newTheme.textColor}
                    onChange={(e) => setNewTheme({ ...newTheme, textColor: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                    style={{ border: "1px solid rgba(124,58,237,0.25)" }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                  Фон карточек
                </label>
                <input
                  type="color"
                  value={newTheme.cardBackground}
                  onChange={(e) => setNewTheme({ ...newTheme, cardBackground: e.target.value })}
                  className="w-full h-10 rounded cursor-pointer"
                  style={{ border: "1px solid rgba(124,58,237,0.25)" }}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2 rounded text-sm"
                style={{ background: "rgba(255,255,255,0.04)", color: "#6b6b8a", fontFamily: "var(--font-display)" }}
              >
                Отмена
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 py-2 rounded text-sm font-semibold"
                style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", fontFamily: "var(--font-display)" }}
              >
                {saving ? 'Сохранение...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
