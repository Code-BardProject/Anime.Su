import { useState, useEffect } from "react";
import { adminApi } from "../../../services/adminApi";

interface ScheduleItem {
  id: string;
  title: string;
  cover: string;
  scheduleDate: string;
  scheduleDay: string;
  status: string;
  episodes: number;
  episodesAired: number;
}

interface ScheduleProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const dayNamesShort = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export default function Schedule({ onNavigate }: ScheduleProps) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminApi.getSchedule();
      if (result.success) {
        setSchedule((result.items || result.data || []) as ScheduleItem[]);
      } else {
        throw new Error(result.error || "Не удалось загрузить расписание");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки расписания");
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };

  const getDayIndex = (dateString: string) => {
    const date = new Date(dateString);
    return date.getDay();
  };

  const groupByDay = () => {
    const grouped: Record<number, ScheduleItem[]> = {};
    schedule.forEach(item => {
      if (item.scheduleDate) {
        const dayIndex = getDayIndex(item.scheduleDate);
        if (!grouped[dayIndex]) grouped[dayIndex] = [];
        grouped[dayIndex].push(item);
      }
    });
    return grouped;
  };

  const groupedSchedule = groupByDay();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>Загрузка расписания...</p>
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
          onClick={loadSchedule}
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
            📅 РАСПИСАНИЕ
          </h2>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>
            Всего аниме в расписании: {schedule.length}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('calendar')}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
            style={{
              background: viewMode === 'calendar' ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
              color: viewMode === 'calendar' ? "#a855f7" : "#6b6b8a",
              fontFamily: "var(--font-display)",
              border: viewMode === 'calendar' ? "1px solid rgba(124,58,237,0.3)" : "1px solid rgba(255,255,255,0.08)"
            }}
          >
            📅 Календарь
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
            📋 Список
          </button>
        </div>
      </div>

      {schedule.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-2xl" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
          <div className="text-6xl mb-4">📅</div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#e8e8f0", letterSpacing: "0.1em" }}>
            РАСПИСАНИЕ ПУСТО
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a", marginTop: 8 }}>
            Добавьте аниме в расписание через редактирование
          </p>
        </div>
      ) : viewMode === 'calendar' ? (
        /* Calendar View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dayNames.map((dayName, dayIndex) => {
            const dayItems = groupedSchedule[dayIndex] || [];
            return (
              <div
                key={dayIndex}
                className="rounded-2xl p-4 transition-all hover:scale-[1.02]"
                style={{ 
                  background: "var(--card)", 
                  border: "1px solid rgba(124,58,237,0.12)",
                  minHeight: "200px"
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 style={{ 
                    fontFamily: "var(--font-display)", 
                    fontWeight: 700, 
                    fontSize: 16, 
                    color: "#e8e8f0" 
                  }}>
                    {dayName}
                  </h3>
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-semibold"
                    style={{ 
                      background: "rgba(124,58,237,0.2)", 
                      color: "#a855f7",
                      fontFamily: "var(--font-mono)"
                    }}
                  >
                    {dayItems.length}
                  </span>
                </div>

                {dayItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32" style={{ background: "rgba(255,255,255,0.02)", borderRadius: "12px" }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                      Нет релизов
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onNavigate('anime', { animeId: item.id })}
                        className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all hover:bg-purple-500/10"
                        style={{ background: "rgba(255,255,255,0.02)" }}
                      >
                        <img 
                          src={item.cover} 
                          alt={item.title} 
                          className="w-12 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p style={{ 
                            fontFamily: "var(--font-display)", 
                            fontSize: 12, 
                            color: "#e8e8f0", 
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}>
                            {item.title}
                          </p>
                          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a" }}>
                            {item.episodesAired}/{item.episodes} серий
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
          <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center" style={{ background: "rgba(124,58,237,0.08)", borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
            <div className="col-span-4" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Аниме
            </div>
            <div className="col-span-2" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              День недели
            </div>
            <div className="col-span-2" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Дата
            </div>
            <div className="col-span-2" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Прогресс
            </div>
            <div className="col-span-2" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Статус
            </div>
          </div>

          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {schedule.map((item, index) => {
              const dayIndex = item.scheduleDate ? getDayIndex(item.scheduleDate) : 0;
              const progress = (item.episodesAired / item.episodes) * 100;
              
              return (
                <div
                  key={item.id}
                  onClick={() => onNavigate('anime', { animeId: item.id })}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center transition-all hover:bg-purple-500/5 cursor-pointer"
                  style={{ background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <img 
                      src={item.cover} 
                      alt={item.title} 
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
                        {item.title}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ 
                        background: "rgba(124,58,237,0.2)", 
                        color: "#a855f7",
                        fontFamily: "var(--font-display)"
                      }}
                    >
                      {dayNamesShort[dayIndex]}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#a0a0b8" }}>
                      {item.scheduleDate ? new Date(item.scheduleDate).toLocaleDateString('ru-RU') : '—'}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <div className="w-full">
                      <div className="flex justify-between mb-1">
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a" }}>
                          {item.episodesAired}/{item.episodes}
                        </span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a" }}>
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${progress}%`, 
                            background: "linear-gradient(90deg, #7c3aed, #a855f7)" 
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ 
                        background: item.status === 'ongoing' ? "rgba(74,222,128,0.2)" : 
                                  item.status === 'completed' ? "rgba(124,58,237,0.2)" : 
                                  "rgba(251,191,36,0.2)",
                        color: item.status === 'ongoing' ? "#4ade80" : 
                               item.status === 'completed' ? "#a855f7" : 
                               "#fbbf24",
                        fontFamily: "var(--font-display)"
                      }}
                    >
                      {item.status === 'ongoing' ? 'Онгоинг' : 
                       item.status === 'completed' ? 'Завершён' : 
                       'Анонс'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}