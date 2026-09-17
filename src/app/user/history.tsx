import { useState, useEffect } from "react";
import { getHistory } from "../../../services/userApi";

interface HistoryItem {
  id: string;
  animeId: string;
  animeTitle: string;
  animeCover: string;
  episode: number;
  duration: number;
  watchedAt: string;
}

interface HistoryProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const fallbackHistory: HistoryItem[] = [
  {
    id: 'hist-1',
    animeId: '1',
    animeTitle: 'Jujutsu Kaisen',
    animeCover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=900&q=80',
    episode: 12,
    duration: 24,
    watchedAt: 'Сегодня, 21:00',
  },
  {
    id: 'hist-2',
    animeId: '2',
    animeTitle: 'Frieren: Beyond Journey\'s End',
    animeCover: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80',
    episode: 8,
    duration: 22,
    watchedAt: 'Вчера, 19:40',
  },
  {
    id: 'hist-3',
    animeId: '3',
    animeTitle: 'Solo Leveling',
    animeCover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    episode: 6,
    duration: 18,
    watchedAt: '3 дня назад',
  },
];

export default function History({ onNavigate }: HistoryProps) {
  const [items, setItems] = useState<HistoryItem[]>(fallbackHistory);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(fallbackHistory.length);
  const pageSize = 20;

  useEffect(() => {
    loadHistory();
  }, [page]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getHistory({ limit: pageSize, offset: page * pageSize });
      if (data.success && Array.isArray(data.items)) {
        setItems(data.items.length ? data.items : []);
        setTotal(data.total ?? data.items.length ?? 0);
        return;
      }

      setItems(fallbackHistory);
      setTotal(fallbackHistory.length);
    } catch (err) {
      console.error(err);
      setItems(fallbackHistory);
      setTotal(fallbackHistory.length);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Вы уверены, что хотите очистить историю?')) return;

    try {
      setItems([]);
      setTotal(0);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      setItems(items.filter(item => item.id !== id));
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const handleWatch = (animeId: string, episode: number) => {
    onNavigate('anime', { animeId, episode });
  };

  const totalPages = Math.ceil(total / pageSize);

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
          onClick={loadHistory}
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
          ИСТОРИЯ ПРОСМОТРОВ
        </h2>
        {items.length > 0 && (
          <button
            onClick={handleClear}
            className="px-4 py-2 rounded text-sm"
            style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", fontFamily: "var(--font-display)" }}
          >
            Очистить историю
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64">
          <p style={{ fontFamily: "var(--font-display)", fontSize: 48, marginBottom: 16 }}>📜</p>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#e8e8f0", letterSpacing: "0.1em" }}>
            ИСТОРИЯ ПУСТА
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a", marginTop: 8 }}>
            Здесь будет отображена история ваших просмотров
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
                style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}
                onClick={() => handleWatch(item.animeId, item.episode)}
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
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                      Серия {item.episode}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                      {item.watchedAt}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item.id);
                    }}
                    className="w-full py-2 rounded text-xs transition-all"
                    style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", fontFamily: "var(--font-mono)" }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-4 py-2 rounded text-sm disabled:opacity-50"
                style={{ background: "rgba(124,58,237,0.1)", color: "#a855f7", fontFamily: "var(--font-display)" }}
              >
                Назад
              </button>
              <span className="px-4 py-2" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>
                Страница {page + 1} из {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page === totalPages - 1}
                className="px-4 py-2 rounded text-sm disabled:opacity-50"
                style={{ background: "rgba(124,58,237,0.1)", color: "#a855f7", fontFamily: "var(--font-display)" }}
              >
                Вперёд
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
