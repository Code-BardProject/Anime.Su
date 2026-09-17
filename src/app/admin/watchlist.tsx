import { useState, useEffect } from "react";
import { getWatchlist, updateWatchlistItem, removeWatchlistItem } from "../../../services/userApi";
import { database } from "../../../services/database";
import { animeList } from "../../data/mockData";

interface WatchlistItem {
  id: string;
  animeId: string;
  animeTitle: string;
  animeCover: string;
  status: 'planned' | 'watching' | 'completed' | 'dropped';
  score: number;
  addedAt: string;
}

interface WatchlistProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const statusLabels: Record<WatchlistItem['status'], string> = {
  planned: 'Запланировано',
  watching: 'Смотрю',
  completed: 'Завершено',
  dropped: 'Брошено',
};

const statusColors: Record<WatchlistItem['status'], string> = {
  planned: '#22d3ee',
  watching: '#a855f7',
  completed: '#4ade80',
  dropped: '#f87171',
};

const statusIcons: Record<WatchlistItem['status'], string> = {
  planned: '📅',
  watching: '👀',
  completed: '✅',
  dropped: '❌',
};

export default function Watchlist({ onNavigate }: WatchlistProps) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<WatchlistItem['status'] | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First ensure anime list is loaded from database
      await database.loadAnimeFromDatabase();
      
      const data = await getWatchlist();
      if (data.success) {
        // Map anime data to watchlist items
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
        console.warn('Watchlist load failed:', data.error || 'Failed to load');
        setItems([]);
      }
    } catch (err) {
      console.error('Failed to load watchlist:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: WatchlistItem['status']) => {
    try {
      const result = await updateWatchlistItem(id, { status });
      if (result.success) {
        setItems(items.map(item => 
          item.id === id ? { ...item, status } : item
        ));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleScoreChange = async (id: string, score: number) => {
    try {
      const result = await updateWatchlistItem(id, { score });
      if (result.success) {
        setItems(items.map(item => 
          item.id === id ? { ...item, score } : item
        ));
      }
    } catch (err) {
      console.error('Failed to update score:', err);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const result = await removeWatchlistItem(id);
      if (result.success) {
        setItems(items.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const handleWatch = (animeId: string) => {
    onNavigate('anime', { animeId });
  };

  const filteredItems = filter === 'all' ? items : items.filter(item => item.status === filter);

  const statusCounts = {
    planned: items.filter(i => i.status === 'planned').length,
    watching: items.filter(i => i.status === 'watching').length,
    completed: items.filter(i => i.status === 'completed').length,
    dropped: items.filter(i => i.status === 'dropped').length,
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
          onClick={loadWatchlist}
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
            📋 СПИСОК ОТЛОЖЕННОГО
          </h2>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>
            Всего: {items.length} аниме
          </p>
        </div>

        <div className="flex gap-2">
          {/* View Toggle */}
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

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'planned', 'watching', 'completed', 'dropped'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
            style={{
              background: filter === status ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
              color: filter === status ? "#a855f7" : "#6b6b8a",
              fontFamily: "var(--font-display)",
              border: filter === status ? "1px solid rgba(124,58,237,0.3)" : "1px solid rgba(255,255,255,0.08)"
            }}
          >
            {statusIcons[status]} {status === 'all' ? 'Все' : statusLabels[status]}
            {status !== 'all' && statusCounts[status] > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{ 
                background: `${statusColors[status]}40`, 
                color: statusColors[status] 
              }}>
                {statusCounts[status]}
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-2xl" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
          <div className="text-6xl mb-4">📋</div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#e8e8f0", letterSpacing: "0.1em" }}>
            СПИСОК ПУСТ
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a", marginTop: 8 }}>
            {filter !== 'all' ? `Нет аниме со статусом "${statusLabels[filter]}"` : "Добавьте аниме в список отложенного"}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer"
              style={{ 
                background: "var(--card)", 
                border: `1px solid ${statusColors[item.status]}40`,
                borderTop: `4px solid ${statusColors[item.status]}`
              }}
              onClick={() => handleWatch(item.animeId)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video">
                <img
                  src={item.animeCover}
                  alt={item.animeTitle}
                  className="w-full h-full object-cover"
                />
                {/* Status Badge */}
                <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1" style={{ 
                  background: `${statusColors[item.status]}90`, 
                  color: "#fff",
                  fontFamily: "var(--font-display)"
                }}>
                  {statusIcons[item.status]} {statusLabels[item.status]}
                </div>
                {/* Score Badge */}
                {item.score > 0 && (
                  <div className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-semibold" style={{ 
                    background: "rgba(0,0,0,0.7)", 
                    color: "#fbbf24",
                    fontFamily: "var(--font-display)"
                  }}>
                    ⭐ {item.score}/10
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 style={{ 
                  fontFamily: "var(--font-display)", 
                  fontWeight: 600, 
                  fontSize: 14, 
                  color: "#e8e8f0", 
                  marginBottom: 12,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}>
                  {item.animeTitle}
                </h3>
                
                {/* Status */}
                <div className="mb-3">
                  <label style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, display: "block" }}>
                    Статус
                  </label>
                  <select
                    value={item.status}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleStatusChange(item.id, e.target.value as WatchlistItem['status']);
                    }}
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none transition-all cursor-pointer"
                    style={{ 
                      background: `${statusColors[item.status]}20`, 
                      color: statusColors[item.status], 
                      fontFamily: "var(--font-body)",
                      border: `1px solid ${statusColors[item.status]}40`
                    }}
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Score */}
                <div className="mb-3">
                  <label style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, display: "block" }}>
                    Оценка
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                      <button
                        key={score}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScoreChange(item.id, score);
                        }}
                        style={{ 
                          fontSize: 12, 
                          color: score <= item.score ? '#fbbf24' : '#4b5563',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          transition: 'transform 0.1s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                    {item.addedAt}
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
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                onClick={() => handleWatch(item.animeId)}
                className="flex items-center gap-4 p-4 transition-all hover:bg-purple-500/5 cursor-pointer"
                style={{ 
                  background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                  borderLeft: `4px solid ${statusColors[item.status]}`
                }}
              >
                {/* Thumbnail */}
                <img
                  src={item.animeCover}
                  alt={item.animeTitle}
                  className="w-16 h-20 object-cover rounded"
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
                  <div className="flex items-center gap-4 mt-2">
                    <span 
                      className="px-2 py-0.5 rounded text-xs font-semibold"
                      style={{ 
                        background: `${statusColors[item.status]}20`, 
                        color: statusColors[item.status],
                        fontFamily: "var(--font-display)"
                      }}
                    >
                      {statusLabels[item.status]}
                    </span>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                      {item.addedAt}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="w-32">
                  <select
                    value={item.status}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleStatusChange(item.id, e.target.value as WatchlistItem['status']);
                    }}
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none transition-all cursor-pointer"
                    style={{ 
                      background: `${statusColors[item.status]}20`, 
                      color: statusColors[item.status], 
                      fontFamily: "var(--font-body)",
                      border: `1px solid ${statusColors[item.status]}40`
                    }}
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Score */}
                <div className="w-40">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                      <button
                        key={score}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScoreChange(item.id, score);
                        }}
                        style={{ 
                          fontSize: 14, 
                          color: score <= item.score ? '#fbbf24' : '#4b5563',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  {item.score > 0 && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#fbbf24", marginLeft: 8 }}>
                      {item.score}/10
                    </span>
                  )}
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