import { animeList } from "../data/mockData";

interface SchedulePageProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const days = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const weekSchedule = [
  [
    { time: "14:00", animeId: 1 },
    { time: "19:30", animeId: 6 },
  ],
  [
    { time: "16:30", animeId: 2 },
  ],
  [
    { time: "12:00", animeId: 4 },
    { time: "20:00", animeId: 5 },
  ],
  [
    { time: "15:00", animeId: 8 },
  ],
  [
    { time: "14:00", animeId: 1 },
    { time: "17:00", animeId: 3 },
  ],
  [
    { time: "13:00", animeId: 7 },
    { time: "19:00", animeId: 2 },
  ],
  [
    { time: "16:00", animeId: 6 },
  ],
];

const todayIdx = 3; // Thursday

export default function SchedulePage({ onNavigate }: SchedulePageProps) {
  return (
    <div className="min-h-screen pt-14 px-6 md:px-16 py-10" style={{ background: "var(--background)" }}>
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          РАСПИСАНИЕ <span style={{ color: "#a855f7" }}>ОНГОИНГОВ</span>
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a", marginTop: 4 }}>Время выхода новых серий · Москва (UTC+3)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {days.map((day, i) => (
          <div
            key={day}
            className="rounded p-3"
            style={{
              background: i === todayIdx ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.02)",
              border: i === todayIdx ? "1px solid rgba(124,58,237,0.35)" : "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: i === todayIdx ? "#a855f7" : "#e8e8f0", letterSpacing: "0.08em" }}>{day}</span>
              {i === todayIdx && (
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#a855f7", boxShadow: "0 0 6px #a855f7" }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#a855f7" }}>TODAY</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {weekSchedule[i].map((slot, j) => {
                const anime = animeList.find(a => a.id === slot.animeId);
                if (!anime) return null;
                return (
                  <div
                    key={j}
                    className="cursor-pointer group"
                    onClick={() => onNavigate("anime", anime)}
                  >
                    <div className="flex items-start gap-2 p-2 rounded transition-all" style={{ background: "rgba(255,255,255,0.03)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.1)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    >
                      <img src={anime.cover} alt={anime.title} className="w-8 h-11 object-cover rounded flex-shrink-0" />
                      <div className="min-w-0">
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#a855f7" }}>{slot.time}</p>
                        <p className="line-clamp-2" style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#e8e8f0", fontWeight: 600, lineHeight: 1.3 }}>{anime.title}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {weekSchedule[i].length === 0 && (
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a" }}>Нет выходов</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
