import { useState, useEffect } from "react";
import { getThemes, getActiveTheme, setActiveTheme } from "../../../services/userApi";

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

const fallbackThemes: Theme[] = [
  {
    id: 'theme-dark',
    name: 'Тёмная',
    primaryColor: '#7c3aed',
    secondaryColor: '#a855f7',
    backgroundColor: '#0b0b12',
    textColor: '#f5f5f5',
    cardBackground: '#171720',
    isActive: true,
  },
  {
    id: 'theme-violet',
    name: 'Фиолетовая',
    primaryColor: '#8b5cf6',
    secondaryColor: '#c084fc',
    backgroundColor: '#120d1d',
    textColor: '#f8f4ff',
    cardBackground: '#1d1529',
    isActive: false,
  },
  {
    id: 'theme-sky',
    name: 'Небесная',
    primaryColor: '#38bdf8',
    secondaryColor: '#0ea5e9',
    backgroundColor: '#0b1120',
    textColor: '#e0f2fe',
    cardBackground: '#111827',
    isActive: false,
  },
];

export default function Thema({ onNavigate }: ThemaProps) {
  const [themes, setThemes] = useState<Theme[]>(fallbackThemes);
  const [activeTheme, setCurrentTheme] = useState<Theme | null>(fallbackThemes[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      setLoading(true);
      setError(null);
      const [themesData, activeData] = await Promise.all([
        getThemes(),
        getActiveTheme(),
      ]);
      if (themesData.success && Array.isArray(themesData.themes) && themesData.themes.length > 0) {
        setThemes(themesData.themes);
      } else {
        setThemes(fallbackThemes);
      }

      if (activeData.success && activeData.theme) {
        setCurrentTheme(activeData.theme);
      } else {
        setCurrentTheme(fallbackThemes[0]);
      }
    } catch (err) {
      console.error(err);
      setThemes(fallbackThemes);
      setCurrentTheme(fallbackThemes[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      const result = await setActiveTheme(id);
      if (result.success) {
        const activeData = await getActiveTheme();
        if (activeData.success && activeData.theme) {
          setCurrentTheme(activeData.theme);
          setThemes(themes.map(t => ({ ...t, isActive: t.id === id })));
        } else {
          setThemes(themes.map(t => ({ ...t, isActive: t.id === id })));
          setCurrentTheme(themes.find(t => t.id === id) ?? null);
        }
      }
    } catch (err) {
      console.error('Failed to set active theme:', err);
    }
  };

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
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 24 }}>
        ТЕМЫ
      </h2>

      {themes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64">
          <p style={{ fontFamily: "var(--font-display)", fontSize: 48, marginBottom: 16 }}>🎨</p>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#e8e8f0", letterSpacing: "0.1em" }}>
            НЕТ ТЕМ
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a", marginTop: 8 }}>
            Доступные темы оформления
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes.map((theme) => (
            <div
              key={theme.id}
              className="rounded overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
              style={{ 
                background: theme.cardBackground, 
                border: theme.isActive ? "2px solid #a855f7" : "1px solid rgba(124,58,237,0.12)",
                position: 'relative'
              }}
              onClick={() => !theme.isActive && handleSetActive(theme.id)}
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
                {!theme.isActive && (
                  <button
                    className="w-full py-2 rounded text-xs transition-all"
                    style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", fontFamily: "var(--font-mono)" }}
                  >
                    Активировать
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
