import { useState } from "react";
import { animeList } from "../data/mockData";
import { useLanguage } from "../i18n/in8n";
import AnimeCard from "./AnimeCard";

interface CatalogPageProps {
  onNavigate: (page: string, data?: unknown) => void;
}

export default function CatalogPage({ onNavigate }: CatalogPageProps) {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("score");

  const genreValuesByLanguage = {
    ru: ["Экшен", "Фэнтези", "Исекай", "Романтика", "Сёнэн", "Сёдзё", "Меха", "Слайс-оф-лайф", "Ужасы", "Комедия", "Спорт", "Психологическое", "Мистика", "Исторический", "Триллер"],
    en: ["Action", "Fantasy", "Isekai", "Romance", "Shonen", "Shoujo", "Mecha", "Slice of Life", "Horror", "Comedy", "Sports", "Psychological", "Mystery", "Historical", "Thriller"],
    hy: ["Էքշեն", "Ֆենթեզի", "Իսեկայ", "Ռոմանտիկա", "Շոնեն", "Շոջո", "Մեխա", "Սլայս-օֆ-լայֆ", "Սարսափ", "Կատակերգություն", "Սպորտ", "Հոգեբանական", "Գաղտնիք", "Պատմական", "Թրիլլեր"],
  };

  const genreLabels = genreValuesByLanguage[language] ?? genreValuesByLanguage.ru;
  const canonicalGenreFromLabel = (label: string) => {
    const index = genreLabels.indexOf(label);
    return index >= 0 ? genreValuesByLanguage.ru[index] : label;
  };

  const toggleGenre = (g: string) =>
    setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const statusOptions = [
    ["all", t.catalog.all],
    ["ongoing", t.catalog.ongoing],
    ["completed", t.catalog.completed],
    ["upcoming", t.catalog.upcoming],
  ] as const;

  const sortOptions = [
    ["score", t.catalog.sortScore],
    ["views", t.catalog.sortViews],
    ["year", t.catalog.sortYear],
  ] as const;

  const filtered = animeList
    .filter(a => {
      if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.titleEn.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      const normalizedSelectedGenres = selectedGenres.map(canonicalGenreFromLabel);
      if (normalizedSelectedGenres.length && !normalizedSelectedGenres.every(g => a.genres.includes(g))) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "score") return b.score - a.score;
      if (sort === "views") return b.views - a.views;
      if (sort === "year") return b.year - a.year;
      return 0;
    });

  return (
    <div className="min-h-screen pt-14" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="px-6 md:px-16 py-8" style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {t.catalog.title} <span style={{ color: "#a855f7" }}>Anime.Su</span>
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a", marginTop: 4 }}>{animeList.length} {t.catalog.results} {t.catalog.found}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-0">
        {/* Sidebar filters */}
        <aside className="lg:w-64 flex-shrink-0 p-6 lg:p-8" style={{ borderRight: "1px solid rgba(124,58,237,0.1)" }}>
          {/* Search */}
          <div className="mb-6">
            <label style={{ fontFamily: "var(--font-display)", fontSize: 12, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase" }}>{t.catalog.search}</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.catalog.placeholder}
              className="mt-2 w-full px-3 py-2 rounded text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.2)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 13 }}
            />
          </div>

          {/* Status */}
          <div className="mb-6">
            <label style={{ fontFamily: "var(--font-display)", fontSize: 12, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase" }}>{t.catalog.status}</label>
            <div className="mt-2 flex flex-col gap-1">
              {statusOptions.map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setStatusFilter(val)}
                  className="w-full text-left px-3 py-2 rounded text-sm transition-all"
                  style={{
                    background: statusFilter === val ? "rgba(124,58,237,0.2)" : "transparent",
                    color: statusFilter === val ? "#a855f7" : "#a0a0b8",
                    fontFamily: "var(--font-display)",
                    fontSize: 13,
                    fontWeight: statusFilter === val ? 700 : 400,
                    border: statusFilter === val ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="mb-6">
            <label style={{ fontFamily: "var(--font-display)", fontSize: 12, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase" }}>{t.catalog.sort}</label>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="mt-2 w-full px-3 py-2 rounded text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.2)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 13 }}
            >
              {sortOptions.map(([value, label]) => (
                <option key={value} value={value} style={{ background: "#13131c" }}>{label}</option>
              ))}
            </select>
          </div>

          {/* Genres */}
          <div>
            <label style={{ fontFamily: "var(--font-display)", fontSize: 12, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase" }}>{t.catalog.genres}</label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {genreLabels.map(g => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className="px-2 py-1 rounded text-xs transition-all"
                  style={{
                    background: selectedGenres.includes(g) ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.04)",
                    border: selectedGenres.includes(g) ? "1px solid rgba(168,85,247,0.5)" : "1px solid rgba(255,255,255,0.06)",
                    color: selectedGenres.includes(g) ? "#a855f7" : "#6b6b8a",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
            {selectedGenres.length > 0 && (
              <button
                onClick={() => setSelectedGenres([])}
                className="mt-2 text-xs"
                style={{ color: "#a855f7", fontFamily: "var(--font-mono)" }}
              >
                {t.catalog.resetGenres}
              </button>
            )}
          </div>
        </aside>

        {/* Grid */}
        <main className="flex-1 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>
              {t.catalog.found}: <span style={{ color: "#a855f7" }}>{filtered.length}</span> {t.catalog.results}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="text-6xl mb-4">🔍</div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "#6b6b8a", letterSpacing: "0.06em" }}>{t.catalog.none}</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-5">
              {filtered.map(a => (
                <AnimeCard key={a.id} anime={a} onClick={() => onNavigate("anime", a)} size="md" />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
