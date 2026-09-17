import { useState, useEffect } from "react";
import { getHistory, clearHistory, removeHistoryItem } from "../../../services/userApi";
import { database } from "../../../services/database";
import { animeList } from "../../data/mockData";

interface HistoryItem {
  id: string;
  animeId: string;
  animeTitle: string;
  animeCover: string;
  episode: number;
  watchedAt: string;
  duration: number;
}

interface HistoryProps {
  onNavigate: (page: string, data?: unknown) => void;
}

export default function History({ onNavigate }: HistoryProps) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const pageSize = 20;

  useEffect(() => {
    loadHistory();
  }, [page]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First ensure anime list is loaded from database
      await database.loadAnimeFromDatabase();
      
      const data = await getHistory({ limit: pageSize, offset: page * pageSize });
      if (data.success) {
        // Map anime data to history items
        const itemsWithAnime = (data.items || []).map(item => {
          const anime = animeList.find(a => String(a.id) === String(item.animeId));
          return {
            ...item,
            animeTitle: anime?.title || item.animeTitle,
            animeCover: anime?.cover || item.animeCover,
          };
        });
        setItems(itemsWithAnime);
        setTotal(data.total || 0);
      } else {
        console.warn('History load failed:', data.error || 'Failed to load');
        setItems([]);
        setTotal(0);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Вы уверены, что хотите очистить всю историю просмотров?')) return;
    
    try {
      const result = await clearHistory();
      if (result.success) {
        setItems([]);
        setTotal(0);
      }
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      const result = await removeHistoryItem(id);
      if (result.success) {
        setItems(items.filter(item => item.id !== id));
        setTotal(total - 1);
      }
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Удалить ${selectedItems.size} записей из истории?`)) return;
    
    try {
      const promises = Array.from(selectedItems).map(id => removeHistoryItem(id));
      await Promise.all(promises);
      setSelectedItems(new Set());
      loadHistory();
    } catch (err) {
      console.error('Bulk delete failed:', err);
    }
  };

  const handleWatch = (animeId: string, episode: number) => {
    onNavigate('anime', { animeId, episode });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}ч ${mins}м`;
    }
    return `${mins}м`;
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading && page === 0) {
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
          onClick={loadHistory}
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
            📜 ИСТОРИЯ ПРОСМОТРОВ
          </h2>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>
            Всего: {total} записей
          </p>
        </div>

        {total > 0 && (
          <button
            onClick={handleClearHistory}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
            style={{ background: "rgba(248,113,113,0.2)", color: "#f87171", fontFamily: "var(--font-display)" }}
          >
            🗑️ Очистить историю
          </button>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="mb-6 p-4 rounded-xl flex items-center justify-between" style={{ 
          background: "rgba(124,58,237,0.1)", 
          border: "1px solid rgba(124,58,237,0.3)" 
        }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "#e8e8f0" }}>
            Выбрано: {selectedItems.size} записей
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
              style={{ background: "rgba(248,113,113,0.2)", color: "#f87171", fontFamily: "var(--font-display)" }}
            >
              Удалить выбранные
            </button>
            <button
              onClick={() => setSelectedItems(new Set())}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
              style={{ background: "rgba(255,255,255,0.1)", color: "#6b6b8a", fontFamily: "var(--font-display)" }}
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-2xl" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
          <div className="text-6xl mb-4">📜</div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#e8e8f0", letterSpacing: "0.1em" }}>
            ИСТОРИЯ ПУСТА
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a", marginTop: 8 }}>
            Здесь будет отображаться история ваших просмотров
          </p>
        </div>
      ) : (
        <>
          {/* History Table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center" style={{ background: "rgba(124,58,237,0.08)", borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
              <div className="col-span-1">
                <input
                  type="checkbox"
                  checked={selectedItems.size === items.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded cursor-pointer"
                  style={{ accentColor: "#a855f7" }}
                />
              </div>
              <div className="col-span-4" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Аниме
              </div>
              <div className="col-span-2" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Серия
              </div>
              <div className="col-span-2" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Длительность
              </div>
              <div className="col-span-2" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Дата
              </div>
              <div className="col-span-1" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Действия
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {items.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => handleWatch(item.animeId, item.episode)}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center transition-all hover:bg-purple-500/5 cursor-pointer"
                  style={{ background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}
                >
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectItem(item.id);
                      }}
                      className="w-4 h-4 rounded cursor-pointer"
                      style={{ accentColor: "#a855f7" }}
                    />
                  </div>
                  
                  <div className="col-span-4 flex items-center gap-3">
                    <img 
                      src={item.animeCover} 
                      alt={item.animeTitle} 
                      className="w-12 h-16 object-cover rounded"
                    />
                    <div className="min-w-0">
                      <p style={{ 
                        fontFamily: "var(--font-display)", 
                        fontSize: 14, 
                        color: "#e8e8f0", 
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        {item.animeTitle}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span 
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ 
                        background: "rgba(124,58,237,0.2)", 
                        color: "#a855f7",
                        fontFamily: "var(--font-display)"
                      }}
                    >
                      Серия {item.episode}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#a0a0b8" }}>
                      {formatDuration(item.duration)}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                      {item.watchedAt}
                    </p>
                  </div>

                  <div className="col-span-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveItem(item.id);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                      style={{ background: "rgba(248,113,113,0.2)", color: "#f87171", fontFamily: "var(--font-display)" }}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-6 py-3 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all hover:scale-105"
                style={{ 
                  background: "rgba(124,58,237,0.2)", 
                  color: "#a855f7", 
                  fontFamily: "var(--font-display)" 
                }}
              >
                ← Назад
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className="w-10 h-10 rounded-lg text-sm font-semibold transition-all hover:scale-105"
                    style={{
                      background: page === i ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "rgba(255,255,255,0.04)",
                      color: page === i ? "#fff" : "#6b6b8a",
                      fontFamily: "var(--font-display)"
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-6 py-3 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all hover:scale-105"
                style={{ 
                  background: "rgba(124,58,237,0.2)", 
                  color: "#a855f7", 
                  fontFamily: "var(--font-display)" 
                }}
              >
                Вперёд →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}