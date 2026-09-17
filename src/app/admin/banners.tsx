import { useState, useEffect } from "react";
import { adminApi } from "../../../services/adminApi";

interface Banner {
  id: string;
  title: string;
  banner: string;
  images: Array<{ id: string; url: string }>;
  isFeatured: boolean;
  views: number;
  updatedAt: string;
}

interface BannersProps {
  onNavigate: (page: string, data?: unknown) => void;
}

export default function Banners({ onNavigate }: BannersProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBanners, setSelectedBanners] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminApi.getBanners();
      if (result.success) {
        setBanners((result.items || result.data || []) as Banner[]);
      } else {
        throw new Error(result.error || "Не удалось загрузить баннеры");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки баннеров");
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (bannerId: string) => {
    try {
      // This would need to be implemented in the backend
      setBanners(banners.map(b => 
        b.id === bannerId ? { ...b, isFeatured: !b.isFeatured } : b
      ));
    } catch (err) {
      console.error('Failed to toggle featured:', err);
    }
  };

  const handleSelectBanner = (bannerId: string) => {
    const newSelected = new Set(selectedBanners);
    if (newSelected.has(bannerId)) {
      newSelected.delete(bannerId);
    } else {
      newSelected.add(bannerId);
    }
    setSelectedBanners(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedBanners.size === banners.length) {
      setSelectedBanners(new Set());
    } else {
      setSelectedBanners(new Set(banners.map(b => b.id)));
    }
  };

  const featuredCount = banners.filter(b => b.isFeatured).length;
  const totalViews = banners.reduce((sum, b) => sum + (b.views || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>Загрузка баннеров...</p>
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
          onClick={loadBanners}
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
            🖼️ БАННЕРЫ
          </h2>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>
            Всего: {banners.length} | Рекомендуемых: {featuredCount} | Просмотров: {totalViews.toLocaleString()}
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

      {/* Bulk Actions */}
      {selectedBanners.size > 0 && (
        <div className="mb-6 p-4 rounded-xl flex items-center justify-between" style={{ 
          background: "rgba(124,58,237,0.1)", 
          border: "1px solid rgba(124,58,237,0.3)" 
        }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "#e8e8f0" }}>
            Выбрано: {selectedBanners.size} баннеров
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedBanners(new Set())}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
              style={{ background: "rgba(255,255,255,0.1)", color: "#6b6b8a", fontFamily: "var(--font-display)" }}
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-2xl" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
          <div className="text-6xl mb-4">🖼️</div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#e8e8f0", letterSpacing: "0.1em" }}>
            НЕТ БАННЕРОВ
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a", marginTop: 8 }}>
            Баннеры появятся здесь после добавления изображений к аниме
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="rounded-2xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer"
              style={{ 
                background: "var(--card)", 
                border: banner.isFeatured ? "2px solid #a855f7" : "1px solid rgba(124,58,237,0.12)",
                boxShadow: banner.isFeatured ? "0 0 20px rgba(168,85,247,0.3)" : 'none'
              }}
              onClick={() => onNavigate('anime', { animeId: banner.id })}
            >
              {/* Banner Image */}
              <div className="relative aspect-video">
                <img 
                  src={banner.banner || banner.images?.[0]?.url || 'https://via.placeholder.com/400x225'} 
                  alt={banner.title} 
                  className="w-full h-full object-cover"
                />
                {banner.isFeatured && (
                  <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold" style={{ 
                    background: "linear-gradient(135deg, #7c3aed, #a855f7)", 
                    color: "#fff",
                    fontFamily: "var(--font-display)"
                  }}>
                    ⭐ Рекомендуем
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs" style={{ 
                  background: "rgba(0,0,0,0.7)", 
                  color: "#fff",
                  fontFamily: "var(--font-mono)"
                }}>
                  👁 {banner.views?.toLocaleString() || 0}
                </div>
              </div>

              {/* Banner Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 style={{ 
                    fontFamily: "var(--font-display)", 
                    fontSize: 14, 
                    color: "#e8e8f0", 
                    fontWeight: 600,
                    lineHeight: 1.3
                  }}>
                    {banner.title}
                  </h3>
                  <input
                    type="checkbox"
                    checked={selectedBanners.has(banner.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectBanner(banner.id);
                    }}
                    className="w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: "#a855f7" }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFeatured(banner.id);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                    style={{ 
                      background: banner.isFeatured ? "rgba(251,191,36,0.2)" : "rgba(124,58,237,0.2)",
                      color: banner.isFeatured ? "#fbbf24" : "#a855f7",
                      fontFamily: "var(--font-display)"
                    }}
                  >
                    {banner.isFeatured ? '⭐ Убрать' : '⭐ Рекомендовать'}
                  </button>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a" }}>
                    {new Date(banner.updatedAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center" style={{ background: "rgba(124,58,237,0.08)", borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
            <div className="col-span-1">
              <input
                type="checkbox"
                checked={selectedBanners.size === banners.length}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded cursor-pointer"
                style={{ accentColor: "#a855f7" }}
              />
            </div>
            <div className="col-span-4" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Баннер
            </div>
            <div className="col-span-2" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Статус
            </div>
            <div className="col-span-2" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Просмотров
            </div>
            <div className="col-span-2" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Обновлено
            </div>
            <div className="col-span-1" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Действия
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                onClick={() => onNavigate('anime', { animeId: banner.id })}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center transition-all hover:bg-purple-500/5 cursor-pointer"
                style={{ background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}
              >
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={selectedBanners.has(banner.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectBanner(banner.id);
                    }}
                    className="w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: "#a855f7" }}
                  />
                </div>

                <div className="col-span-4 flex items-center gap-3">
                  <img 
                    src={banner.banner || banner.images?.[0]?.url || 'https://via.placeholder.com/100x56'} 
                    alt={banner.title} 
                    className="w-16 h-9 object-cover rounded"
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
                      {banner.title}
                    </p>
                  </div>
                </div>

                <div className="col-span-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFeatured(banner.id);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                    style={{ 
                      background: banner.isFeatured ? "rgba(251,191,36,0.2)" : "rgba(124,58,237,0.2)",
                      color: banner.isFeatured ? "#fbbf24" : "#a855f7",
                      fontFamily: "var(--font-display)"
                    }}
                  >
                    {banner.isFeatured ? '⭐ Рекомендуем' : '⭐ Сделать рекомендуемым'}
                  </button>
                </div>

                <div className="col-span-2">
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#a0a0b8" }}>
                    {banner.views?.toLocaleString() || 0}
                  </p>
                </div>

                <div className="col-span-2">
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                    {new Date(banner.updatedAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>

                <div className="col-span-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('anime', { animeId: banner.id });
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                    style={{ 
                      background: "rgba(124,58,237,0.2)", 
                      color: "#a855f7",
                      fontFamily: "var(--font-display)"
                    }}
                  >
                    ✏️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}