import { newsList } from "../data/mockData";

const allNews = [
  ...newsList,
  { id: 5, title: "Топ-10 аниме для начинающих — советы редакции", date: "24 авг 2026", category: "Гайды", image: "https://images.unsplash.com/photo-1777898844359-0fa1d83db921?w=400&h=220&fit=crop&auto=format", views: 34200 },
  { id: 6, title: "Интервью с режиссёром «Магической битвы 3»", date: "23 авг 2026", category: "Интервью", image: "https://images.unsplash.com/photo-1778250503977-4331644a82cf?w=400&h=220&fit=crop&auto=format", views: 28700 },
];

export default function NewsPage() {
  const [featured, ...rest] = allNews;
  return (
    <div className="min-h-screen pt-14 px-6 md:px-16 py-10" style={{ background: "var(--background)" }}>
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          НОВОСТИ <span style={{ color: "#a855f7" }}>& СТАТЬИ</span>
        </h1>
      </div>

      {/* Featured */}
      <div className="relative rounded overflow-hidden mb-10 cursor-pointer group" style={{ height: 360, border: "1px solid rgba(124,58,237,0.2)" }}>
        <img src={featured.image} alt={featured.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.3) 70%, transparent 100%)" }} />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <span className="inline-block mb-3 px-3 py-1 rounded" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", fontFamily: "var(--font-mono)", fontSize: 11, color: "#fff", letterSpacing: "0.08em" }}>{featured.category}</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(20px,3vw,36px)", color: "#e8e8f0", letterSpacing: "0.04em", lineHeight: 1.15 }}>{featured.title}</h2>
          <div className="flex items-center gap-4 mt-3">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>{featured.date}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>{(featured.views / 1000).toFixed(0)}к просм.</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-12">
        {rest.map(n => (
          <article key={n.id} className="rounded overflow-hidden cursor-pointer group" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
            <div className="overflow-hidden h-44">
              <img src={n.image} alt={n.title} className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105" />
            </div>
            <div className="p-4">
              <span className="inline-block mb-2 px-2 py-0.5 rounded" style={{ background: "rgba(124,58,237,0.12)", color: "#a855f7", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.06em" }}>{n.category}</span>
              <h3 className="font-semibold leading-snug mb-3" style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "#e8e8f0", letterSpacing: "0.03em" }}>{n.title}</h3>
              <div className="flex justify-between items-center">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a" }}>{n.date}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a" }}>{(n.views / 1000).toFixed(0)}к просм.</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
