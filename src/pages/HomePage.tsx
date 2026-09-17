import { useState, useEffect } from "react";
import { animeList, newsList, schedule } from "../data/mockData";
import { useLanguage } from "../i18n/in8n";
import AnimeCard from "../components/AnimeCard";

interface HomePageProps {
  onNavigate: (page: string, data?: unknown) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const { t } = useLanguage();
  const [heroIdx, setHeroIdx] = useState(0);
  const [, setViewsRevision] = useState(0);
  const featured = animeList.filter(a => a.isFeatured);
  const current = featured[heroIdx];
  const genreLabels = t.home.genres;

  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % featured.length), 6000);
    return () => clearInterval(t);
  }, [featured.length]);

  useEffect(() => {
    const handleViewsUpdated = () => setViewsRevision((revision) => revision + 1);
    window.addEventListener("animeSu:views-updated", handleViewsUpdated);
    return () => window.removeEventListener("animeSu:views-updated", handleViewsUpdated);
  }, []);

  const ongoings = animeList.filter(a => a.status === "ongoing");
  const popular = [...animeList].sort((a, b) => b.views - a.views).slice(0, 6);
  const topAnime = [...animeList]
    .sort((a, b) => (b.views + b.score * 100_000) - (a.views + a.score * 100_000))
    .slice(0, 15);
  const newAnime = [...animeList].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : Number(a.id) || 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : Number(b.id) || 0;
    return dateB - dateA;
  }).slice(0, 6);

  const SectionTitle = ({ title, sub }: { title: string; sub?: string }) => (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "#525272", letterSpacing: "0.06em", textTransform: "uppercase" }}>{title}</h2>
        {sub && <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a", marginTop: 2 }}>{sub}</p>}
      </div>
      <button style={{ fontFamily: "var(--font-display)", fontSize: 12, color: "#a855f7", letterSpacing: "0.08em" }}>{t.home.all}</button>
    </div>
  );

  const HScroll = ({ children }: { children: React.ReactNode }) => (
    <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollSnapType: "x mandatory" }}>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* HERO */}
      <section className="relative w-full overflow-hidden" style={{ height: "92vh", minHeight: 560 }}>
        <div className="absolute inset-0">
          <img
            key={current.id}
            src={current.banner}
            alt={current.title}
            className="w-full h-full object-cover transition-opacity duration-700"
            style={{ opacity: 1 }}
          />
          <div className="absolute inset-0 hero-gradient" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,15,0.9) 0%, transparent 60%)" }} />
        </div>

        <div className="relative z-10 flex flex-col justify-end h-full pb-16 px-6 md:px-16 max-w-3xl">
          <div className="flex items-center gap-3 mb-4 animate-fade-in-up">
            <div className="px-2 py-0.5 rounded" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "0.1em" }}>{t.home.top}</span>
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>{current.studio} · {current.year}</span>
          </div>
          <h1 className="mb-2 animate-fade-in-up" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(32px,5vw,64px)", color: "#e8e8f0", lineHeight: 1.05, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {current.title}
          </h1>
          <p className="mb-2 animate-fade-in-up" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#a855f7", letterSpacing: "0.1em" }}>
            {current.titleJp}
          </p>
          <p className="mb-6 max-w-lg animate-fade-in-up" style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#a0a0b8", lineHeight: 1.7 }}>
            {current.description}
          </p>
          <div className="flex items-center gap-3 animate-fade-in-up">
            <button
              onClick={() => onNavigate("anime", current)}
              className="flex items-center gap-2 px-6 py-3 rounded font-semibold transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", fontFamily: "var(--font-display)", fontSize: 15, letterSpacing: "0.08em", boxShadow: "0 4px 24px rgba(124,58,237,0.5)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              {t.home.watch}
            </button>
            <button
              className="flex items-center gap-2 px-5 py-3 rounded font-semibold transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8e8f0", fontFamily: "var(--font-display)", fontSize: 14, letterSpacing: "0.06em" }}
            >
              {t.home.addToList}
            </button>
            {current.score > 0 && (
              <div className="flex items-center gap-1.5 ml-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "#fbbf24" }}>{current.score}</span>
              </div>
            )}
          </div>
        </div>

        {/* Hero dots */}
        <div className="absolute bottom-6 left-6 md:left-16 flex gap-2 z-10">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIdx(i)}
              className="rounded-full transition-all"
              style={{ width: i === heroIdx ? 24 : 8, height: 8, background: i === heroIdx ? "#a855f7" : "rgba(255,255,255,0.2)" }}
            />
          ))}
        </div>

        {/* Hero thumbnails */}
        <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 z-10 hidden lg:flex flex-col gap-3">
          {featured.map((a, i) => (
            <button
              key={a.id}
              onClick={() => setHeroIdx(i)}
              className="rounded overflow-hidden transition-all"
              style={{ width: 64, height: 90, opacity: i === heroIdx ? 1 : 0.4, border: i === heroIdx ? "2px solid #a855f7" : "2px solid transparent" }}
            >
              <img src={a.cover} alt={a.title} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </section>

      {/* SCHEDULE strip */}
      <div className="px-6 md:px-16 py-4" style={{ background: "rgba(19,19,28,0.9)", borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
        <div className="flex items-center gap-6 overflow-x-auto">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-2 h-2 rounded-full live-indicator" style={{ background: "#a855f7" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#a855f7", letterSpacing: "0.1em" }}>{t.home.today}</span>
          </div>
          {schedule.map(s => (
            <div key={s.id} className="flex items-center gap-2 flex-shrink-0">
              <img src={s.cover} alt={s.title} className="w-8 h-10 object-cover rounded" />
              <div>
                <p style={{ fontFamily: "var(--font-display)", fontSize: 12, color: "#e8e8f0", fontWeight: 600 }}>{s.title}</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a" }}>Эп. {s.episode} · {s.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 md:px-16 py-12 space-y-14">
        {/* Top Anime */}
        <section>
          <SectionTitle title="Топ Аниме" sub="Самые просматриваемые и высоко оцениваемые" />
          <HScroll>
            {topAnime.map((anime, index) => (
              <button
                key={anime.id}
                type="button"
                onClick={() => onNavigate("anime", anime)}
                aria-label={`Открыть аниме ${anime.title}`}
                className="group relative overflow-hidden text-left transition-transform duration-300 hover:-translate-y-1"
                style={{
                  width: 250,
                  height: 280,
                  borderRadius: 12,
                  border: "1px solid rgba(124,58,237,0.24)",
                  background: "rgba(19,19,28,0.96)",
                  boxShadow: "0 14px 40px rgba(124,58,237,0.14)",
                  flexShrink: 0,
                }}
              >
                <div className="relative overflow-hidden" style={{ height: 220, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                  <img src={anime.cover} alt={anime.title} className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82), transparent)" }} />
                  <span className="absolute top-3 left-3 rounded-full px-2 py-1" style={{ background: "rgba(124,58,237,0.9)", color: "#fff", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700 }}>
                    #{index + 1}
                  </span>
                  {anime.score > 0 && (
                    <span className="absolute top-3 right-3 rounded-full px-2 py-1" style={{ background: "rgba(251,191,36,0.95)", color: "#111", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 800 }}>
                      ★ {anime.score}
                    </span>
                  )}
                </div>
                <div className="px-3 py-3">
                  <p className="line-clamp-2" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#e8e8f0", lineHeight: 1.35 }}>{anime.title}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#a0a0b8" }}>{anime.year}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#a855f7" }}>{anime.views.toLocaleString()} views</span>
                  </div>
                </div>
              </button>
            ))}
          </HScroll>
        </section>

        {/* Ongoings */}
        <section>
          <SectionTitle title={t.home.ongoingTitle} sub={t.home.ongoingSubtitle} />
          <HScroll>
            {ongoings.map(a => <AnimeCard key={a.id} anime={a} onClick={() => onNavigate("anime", a)} />)}
          </HScroll>
        </section>

        {/* Popular */}
        <section>
          <SectionTitle title={t.home.popularTitle} sub={t.home.popularSubtitle} />
          <HScroll>
            {popular.map(a => <AnimeCard key={a.id} anime={a} onClick={() => onNavigate("anime", a)} />)}
          </HScroll>
        </section>

        {/* Genres */}
        <section>
          <SectionTitle title={t.home.genresTitle} />
          <div className="flex flex-wrap gap-2">
            {genreLabels.map(g => (
              <button
                key={g}
                onClick={() => onNavigate("catalog")}
                className="px-4 py-2 rounded transition-all hover:scale-105"
                style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", color: "#a0a0b8", fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600, letterSpacing: "0.04em" }}
                onMouseEnter={e => { (e.target as HTMLElement).style.background = "rgba(124,58,237,0.2)"; (e.target as HTMLElement).style.color = "#e8e8f0"; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = "rgba(124,58,237,0.08)"; (e.target as HTMLElement).style.color = "#a0a0b8"; }}
              >
                {g}
              </button>
            ))}
          </div>
        </section>

        {/* News */}
        <section>
          <SectionTitle title={t.home.newsTitle} sub={t.home.newsSubtitle} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {newsList.map(n => (
              <article
                key={n.id}
                className="rounded cursor-pointer group overflow-hidden"
                style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.15)" }}
              >
                <div className="overflow-hidden h-36">
                  <img src={n.image} alt={n.title} className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105" />
                </div>
                <div className="p-3">
                  <span className="inline-block mb-1.5 px-2 py-0.5 rounded" style={{ background: "rgba(124,58,237,0.15)", color: "#a855f7", fontFamily: "var(--font-mono)", fontSize: 10 }}>{n.category}</span>
                  <p className="font-semibold leading-snug line-clamp-2 mb-2" style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "#e8e8f0" }}>{n.title}</p>
                  <div className="flex justify-between items-center">
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a" }}>{n.date}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a" }}>{(n.views / 1000).toFixed(0)}к просм.</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* New releases */}
        <section>
          <SectionTitle title={t.home.newReleasesTitle} sub={t.home.newReleasesSubtitle} />
          <HScroll>
            {newAnime.map(a => <AnimeCard key={a.id} anime={a} onClick={() => onNavigate("anime", a)} />)}
          </HScroll>
        </section>
      </div>
    </div>
  );
}
