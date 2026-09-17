import { useState, useEffect } from "react";
import { getContinueWatching, removeContinueWatching } from "../../../services/userApi";
import { database } from "../../../services/database";
import { animeList } from "../../data/mockData";

interface ContinueWatchingItem {
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

export default function Continue({ onNavigate }: ContinueProps) {
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadContinueWatching();
  }, []);

  const loadContinueWatching = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First ensure anime list is loaded from database
      await database.loadAnimeFromDatabase();
      
      const data = await getContinueWatching();
      if (data.success) {
        // Map anime data to continue watching items
        const itemsWithAnime = (data.items || []).map(item => {
          const anime = animeList.find(a => String(a.id) === String(item.animeId));
          return {
            ...item,
            animeTitle: anime?.title || item.animeTitle,
            animeCover: anime?.cover || item.animeCover,
          };
        });
        setItems(itemsWithAnime);
      } else {
        console.warn('Continue watching load failed:', data.error || 'Failed to load');
        setItems([]);
      }
    } catch (err) {
      console.error('Failed to load continue watching data:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const result = await removeContinueWatching(id);
      if (result.success) {
        setItems(items.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const handleWatch = (animeId: string, episode: number) => {
    onNavigate('anime', { animeId, episode });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
        <div className="text-6xl mb-4">⚠️</div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#f87171", marginBottom: 12 }}>{error}</p>
        <button
          onClick={loadContinueWatching}
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
            📺 ПРОДОЛЖИТЬ ПРОСМОТР
          </h2>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>
            Всего: {items.length} аниме
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
            style={{
              background: viewMode === 'grid' ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
              color: viewMode === 'grid' ? "#a855f7" : "#6b6b8a",
              fontFamily: "var(--font-display)",
              border: viewMode === 'grid' ? "1px solid rgba(124,58,237,0.3)" : "1px solid rgba(255,255,255,0.08)"
            }}
          >
            ⊞ Сетка
          </button>
          <button
            onClick={() => setViewMode('list')}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
            style={{
              background: viewMode === 'list' ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
              color: viewMode === 'list' ? "#a855f7" : "#6b6b8a",
              fontFamily: "var(--font-display)",
              border: viewMode === 'list' ? "1px solid rgba(124,58,237,0.3)" : "1px solid rgba(255,255,255,0.08)"
            }}
          >
            ☰ Список
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-2xl" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
          <div className="text-6xl mb-4">📺</div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#e8e8f0", letterSpacing: "0.1em" }}>
            НЕТ ПРОСМОТРОВ
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a", marginTop: 8 }}>
            Начните смотреть аниме, чтобы оно появилось здесь
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer"
              style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}
              onClick={() => handleWatch(item.animeId, item.episode)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video">
                <img
                  src={item.animeCover}
                  alt={item.animeTitle}
                  className="w-full h-full object-cover"
                />
                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                {/* Episode Badge */}
                <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold" style={{ 
                  background: "rgba(0,0,0,0.7)", 
                  color: "#fff",
                  fontFamily: "var(--font-mono)"
                }}>
                  {item.episode}/{item.totalEpisodes}
                </div>
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(124,58,237,0.9)" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 style={{ 
                  fontFamily: "var(--font-display)", 
                  fontWeight: 600, 
                  fontSize: 14, 
                  color: "#e8e8f0", 
                  marginBottom: 8,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}>
                  {item.animeTitle}
                </h3>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                      Серия {item.episode}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                      • {formatTime(item.timestamp)}
                    </span>
                  </div>
                  <span 
                    className="px-2 py-0.5 rounded text-xs font-semibold"
                    style={{ 
                      background: "rgba(124,58,237,0.2)", 
                      color: "#a855f7",
                      fontFamily: "var(--font-mono)"
                    }}
                  >
                    {Math.round(item.progress)}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                    {item.lastWatched}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item.id);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                    style={{ background: "rgba(248,113,113,0.2)", color: "#f87171", fontFamily: "var(--font-display)" }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {items.map((item, index) => (
              <div
                key={item.id}
                onClick={() => handleWatch(item.animeId, item.episode)}
                className="flex items-center gap-4 p-4 transition-all hover:bg-purple-500/5 cursor-pointer"
                style={{ background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}
              >
                {/* Thumbnail */}
                <img
                  src={item.animeCover}
                  alt={item.animeTitle}
                  className="w-20 h-12 object-cover rounded"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 style={{ 
                    fontFamily: "var(--font-display)", 
                    fontWeight: 600, 
                    fontSize: 14, 
                    color: "#e8e8f0",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    {item.animeTitle}
                  </h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                      Серия {item.episode}/{item.totalEpisodes}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                      {formatTime(item.timestamp)}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                      {item.lastWatched}
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div className="w-32">
                  <div className="flex justify-between mb-1">
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a" }}>
                      Прогресс
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a" }}>
                      {Math.round(item.progress)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(item.id);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                  style={{ background: "rgba(248,113,113,0.2)", color: "#f87171", fontFamily: "var(--font-display)" }}
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}