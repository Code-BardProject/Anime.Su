interface AnimeCardProps {
  anime: {
    id: number;
    title: string;
    year: number;
    score: number;
    genres: string[];
    cover: string;
    status: string;
    episodes: number;
    episodesAired: number;
    isNew?: boolean;
    studio: string;
    deviceVideos?: string[];
  };
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

const statusLabel: Record<string, { label: string; color: string }> = {
  ongoing: { label: "Онгоинг", color: "#22d3ee" },
  completed: { label: "Завершён", color: "#4ade80" },
  upcoming: { label: "Анонс", color: "#fbbf24" },
};

export default function AnimeCard({ anime, onClick, size = "md" }: AnimeCardProps) {
  const st = statusLabel[anime.status] ?? { label: anime.status, color: "#a0a0b8" };

  const widths = { sm: "w-36", md: "w-44", lg: "w-52" };
  const heights = { sm: "h-52", md: "h-64", lg: "h-76" };

  return (
    <div
      className={`anime-card ${widths[size]} flex-shrink-0 cursor-pointer group`}
      onClick={onClick}
      style={{ animation: "fadeInUp 0.4s ease-out" }}
    >
      <div className={`relative ${heights[size]} rounded overflow-hidden`} style={{ border: "1px solid rgba(124,58,237,0.15)" }}>
        <img
          src={anime.cover}
          alt={anime.title}
          className="anime-card-img w-full h-full object-cover transition-transform duration-400"
        />
        {/* Overlay */}
        <div
          className="anime-card-overlay absolute inset-0 opacity-0 transition-opacity duration-300 flex flex-col justify-end p-3"
          style={{ background: "linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.4) 60%, transparent 100%)" }}
        >
          <div className="flex flex-wrap gap-1 mb-2">
            {anime.genres.slice(0, 2).map(g => (
              <span key={g} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(124,58,237,0.6)", color: "#e8e8f0", fontFamily: "var(--font-mono)", fontSize: 10 }}>{g}</span>
            ))}
          </div>
          <button
            className="w-full py-1.5 rounded text-xs font-semibold transition-all"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", fontFamily: "var(--font-display)", letterSpacing: "0.06em" }}
          >
            СМОТРЕТЬ
          </button>
        </div>

        {/* Score badge */}
        {anime.score > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: "rgba(10,10,15,0.85)", border: "1px solid rgba(168,85,247,0.4)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#fbbf24" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 500, color: "#fbbf24" }}>{anime.score}</span>
          </div>
        )}

        {/* New badge */}
        {anime.isNew && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, color: "#fff", letterSpacing: "0.08em" }}>NEW</span>
          </div>
        )}

        {anime.deviceVideos?.length ? (
          <div className="absolute top-10 left-2 px-1.5 py-0.5 rounded" style={{ background: "rgba(10,10,15,0.85)", border: "1px solid rgba(34,211,238,0.45)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, color: "#22d3ee" }}>▶ {anime.deviceVideos.length}</span>
          </div>
        ) : null}

        {/* Status dot */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: st.color, boxShadow: `0 0 6px ${st.color}` }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: st.color }}>{st.label}</span>
        </div>
      </div>

      {/* Info */}
      <div className="mt-2 px-0.5">
        <p className="text-sm font-semibold leading-tight line-clamp-2" style={{ fontFamily: "var(--font-display)", color: "#e8e8f0", fontSize: 13, letterSpacing: "0.02em" }}>
          {anime.title}
        </p>
        <p className="mt-0.5" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a" }}>
          {anime.year} · {anime.studio}
        </p>
        {anime.status === "ongoing" && (
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#a855f7" }}>
            {anime.episodesAired}/{anime.episodes} эп.
          </p>
        )}
      </div>
    </div>
  );
}
