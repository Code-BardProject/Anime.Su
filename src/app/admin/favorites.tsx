import { useState, useEffect } from "react";
import { getFavorites, removeFavorite, updateFavoriteRating } from "../../../services/userApi";
import { database } from "../../../services/database";
import { animeList } from "../../data/mockData";

interface FavoriteItem {
  id: string;
  animeId: string;
  animeTitle: string;
  animeCover: string;
  rating: number;
  addedAt: string;
}

interface FavoritesProps {
  onNavigate: (page: string, data?: unknown) => void;
}

export default function Favorites({ onNavigate }: FavoritesProps) {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'title'>('date');

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First ensure anime list is loaded from database
      await database.loadAnimeFromDatabase();
      
      const data = await getFavorites();
      if (data.success) {
        // Map anime data to favorites items
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
        console.warn('Favorites load failed:', data.error || 'Failed to load');
        setItems([]);
      }
    } catch (err) {
      console.error('Failed to load favorites:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const result = await removeFavorite(id);
      if (result.success) {
        setItems(items.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  const handleRatingChange = async (id: string, rating: number) => {
    try {
      const result = await updateFavoriteRating(id, rating);
      if (result.success) {
        setItems(items.map(item => 
          item.id === id ? { ...item, rating } : item
        ));
      }
    } catch (err) {
      console.error('Failed to update rating:', err);
    }
  };

  const handleWatch = (animeId: string) => {
    onNavigate('anime', { animeId });
  };

  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    } else if (sortBy === 'rating') {
      return b.rating - a.rating;
    } else {
      return a.animeTitle.localeCompare(b.animeTitle);
    }
  });

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
          onClick={loadFavorites}
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
            ⭐ ИЗБРАННОЕ
          </h2>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>
            Всего: {items.length} аниме
          </p>
        </div>

        <div className="flex gap-2">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'rating' | 'title')}
            className="px-4 py-2 rounded-lg text-xs outline-none transition-all"
            style={{ 
              background: "rgba(255,255,255,0.04)", 
              border: "1px solid rgba(124,58,237,0.25)", 
              color: "#e8e8f0", 
              fontFamily: "var(--font-display)" 
            }}
          >
            <option value="date">По дате</option>
            <option value="rating">По рейтингу</option>
            <option value="title">По названию</option>
          </select>

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

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-2xl" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
          <div className="text-6xl mb-4">⭐</div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#e8e8f0", letterSpacing: "0.1em" }}>
            НЕТ ИЗБРАННОГО
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a", marginTop: 8 }}>
            Добавьте аниме в избранное, чтобы оно появилось здесь
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer"
              style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}
              onClick={() => handleWatch(item.animeId)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video">
                <img
                  src={item.animeCover}
                  alt={item.animeTitle}
                  className="w-full h-full object-cover"
                />
                {/* Rating Badge */}
                {item.rating > 0 && (
                  <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold" style={{ 
                    background: "rgba(251,191,36,0.9)", 
                    color: "#000",
                    fontFamily: "var(--font-display)"
                  }}>
                    ⭐ {item.rating}/5
                  </div>
                )}
                {/* Favorite Badge */}
                <div className="absolute top-2 left-2 px-2 py-1 rounded text-xs" style={{ 
                  background: "rgba(168,85,247,0.9)", 
                  color: "#fff",
                  fontFamily: "var(--font-display)"
                }}>
                  ❤️
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
                
                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRatingChange(item.id, star);
                      }}
                      style={{ 
                        fontSize: 16, 
                        color: star <= item.rating ? '#fbbf24' : '#4b5563',
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
            {sortedItems.map((item, index) => (
              <div
                key={item.id}
                onClick={() => handleWatch(item.animeId)}
                className="flex items-center gap-4 p-4 transition-all hover:bg-purple-500/5 cursor-pointer"
                style={{ background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}
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
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a", marginTop: 4 }}>
                    Добавлено: {item.addedAt}
                  </p>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRatingChange(item.id, star);
                      }}
                      style={{ 
                        fontSize: 18, 
                        color: star <= item.rating ? '#fbbf24' : '#4b5563',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      ★
                    </button>
                  ))}
                  {item.rating > 0 && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#fbbf24", marginLeft: 8 }}>
                      {item.rating}/5
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