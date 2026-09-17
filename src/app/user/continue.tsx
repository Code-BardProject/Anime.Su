import { useState, useEffect } from "react";
import { getContinueWatching } from "../../../services/userApi";

interface ContinueItem {
  id: string;
  animeId: string;
  animeTitle: string;
  animeCover: string;
  episode: number;
  totalEpisodes: number;
  timestamp: number;
  progress: number;
  lastWatched: string;
}

interface ContinueProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const fallbackContinueItems: ContinueItem[] = [
  {
    id: "continue-1",
    animeId: "1",
    animeTitle: "Jujutsu Kaisen",
    animeCover: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=900&q=80",
    episode: 12,
    totalEpisodes: 24,
    timestamp: Date.now(),
    progress: 72,
    lastWatched: "Сегодня, 20:45",
  },
  {
    id: "continue-2",
    animeId: "2",
    animeTitle: "Frieren: Beyond Journey's End",
    animeCover: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80",
    episode: 6,
    totalEpisodes: 28,
    timestamp: Date.now() - 3600000,
    progress: 48,
    lastWatched: "Вчера, 21:15",
  },
];

export default function Continue({ onNavigate }: ContinueProps) {
  const [items, setItems] = useState<ContinueItem[]>(fallbackContinueItems);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContinueWatching();
  }, []);

  const loadContinueWatching = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getContinueWatching();
      if (data.success && Array.isArray(data.items) && data.items.length > 0) {
        setItems(data.items);
        return;
      }

      if (data.success && Array.isArray(data.items) && data.items.length === 0) {
        setItems([]);
        return;
      }

      setItems(fallbackContinueItems);
    } catch (err) {
      console.error(err);
      setItems(fallbackContinueItems);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      setItems(items.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Failed to remove item:", err);
    }
  };

  const handleWatch = (animeId: string, episode: number) => {
    onNavigate("anime", { animeId, episode });
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
          onClick={loadContinueWatching}
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
        ПРОДОЛЖИТЬ ПРОСМОТР
      </h2>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64">
          <p style={{ fontFamily: "var(--font-display)", fontSize: 48, marginBottom: 16 }}>📺</p>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#e8e8f0", letterSpacing: "0.1em" }}>
            НЕТ ПРОСМОТРОВ
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a", marginTop: 8 }}>
            Начните смотреть аниме, чтобы оно появилось здесь
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
              style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}
            >
              <div className="relative">
                <img
                  src={item.animeCover}
                  alt={item.animeTitle}
                  className="w-full h-40 object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                  <div
                    className="h-full bg-purple-500"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
              <div className="p-4">
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, color: "#e8e8f0", marginBottom: 8 }}>
                  {item.animeTitle}
                </h3>
                <div className="flex items-center justify-between mb-3">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                    Серия {item.episode} из {item.totalEpisodes}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#a855f7" }}>
                    {Math.round(item.progress)}%
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleWatch(item.animeId, item.episode)}
                    className="flex-1 py-2 rounded text-xs font-semibold transition-all"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", fontFamily: "var(--font-display)" }}
                  >
                    Смотреть
                  </button>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="px-3 py-2 rounded text-xs transition-all"
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