import { useState, useEffect } from "react";
import { getWatchlist, updateWatchlistItem, removeWatchlistItem } from "../../../services/userApi";
import { useLanguage } from "../../i18n/in8n";

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
  planned: 'planned',
  watching: 'watching',
  completed: 'completed',
  dropped: 'dropped',
};

const fallbackWatchlist: WatchlistItem[] = [
  {
    id: 'watch-1',
    animeId: '1',
    animeTitle: 'Jujutsu Kaisen',
    animeCover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=900&q=80',
    status: 'watching',
    score: 9,
    addedAt: 'Сегодня',
  },
  {
    id: 'watch-2',
    animeId: '2',
    animeTitle: 'Frieren: Beyond Journey\'s End',
    animeCover: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80',
    status: 'planned',
    score: 8,
    addedAt: '2 дня назад',
  },
  {
    id: 'watch-3',
    animeId: '3',
    animeTitle: 'Solo Leveling',
    animeCover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    status: 'completed',
    score: 10,
    addedAt: 'Недавно',
  },
];

export default function Watchlist({ onNavigate }: WatchlistProps) {
  const { t } = useLanguage();
  const [items, setItems] = useState<WatchlistItem[]>(fallbackWatchlist);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<WatchlistItem['status'] | 'all'>('all');
  const statusText = {
    planned: t.profile.watchlist.planned,
    watching: t.profile.watchlist.watching,
    completed: t.profile.watchlist.completed,
    dropped: t.profile.watchlist.dropped,
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWatchlist();
      if (data.success && Array.isArray(data.items)) {
        setItems(data.items.length ? data.items : []);
        return;
      }

      setItems(fallbackWatchlist);
    } catch (err) {
      console.error(err);
      setItems(fallbackWatchlist);
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
          onClick={loadWatchlist}
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
        {t.profile.watchlist.title}
      </h2>

      <div className="flex gap-2 mb-6">
        {(['all', 'planned', 'watching', 'completed', 'dropped'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className="px-4 py-2 rounded text-sm transition-all"
            style={{
              background: filter === status ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
              color: filter === status ? "#a855f7" : "#6b6b8a",
              fontFamily: "var(--font-display)",
              border: filter === status ? "1px solid rgba(124,58,237,0.3)" : "1px solid rgba(255,255,255,0.08)"
            }}
          >
            {status === 'all' ? t.profile.watchlist.all : statusText[status]}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64">
          <p style={{ fontFamily: "var(--font-display)", fontSize: 48, marginBottom: 16 }}>📋</p>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#e8e8f0", letterSpacing: "0.1em" }}>
            {t.profile.watchlist.empty}
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a", marginTop: 8 }}>
            {t.profile.watchlist.emptyHint}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="rounded overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
              style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}
              onClick={() => handleWatch(item.animeId)}
            >
              <img
                src={item.animeCover}
                alt={item.animeTitle}
                className="w-full h-40 object-cover"
              />
              <div className="p-4">
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, color: "#e8e8f0", marginBottom: 8 }}>
                  {item.animeTitle}
                </h3>
                
                <div className="mb-3">
                  <label style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, display: "block" }}>
                    {t.profile.watchlist.status}
                  </label>
                  <select
                    value={item.status}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleStatusChange(item.id, e.target.value as WatchlistItem['status']);
                    }}
                    className="w-full px-3 py-2 rounded text-xs outline-none transition-all"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)" }}
                  >
                    {Object.entries(statusText).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, display: "block" }}>
                    {t.profile.watchlist.score}
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
                          padding: 0
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                    {item.addedAt}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item.id);
                    }}
                    className="px-2 py-1 rounded text-xs transition-all"
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
    </div>
  );
}
