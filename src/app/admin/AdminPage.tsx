import { useEffect, useState } from "react";
import { adminRecentActivity, animeList, appendAnimeItem } from "../../data/mockData";
import AnimeCard from "../../components/AnimeCard";
import { database } from "../../../services/database";
import { adminApi } from "../../../services/adminApi";
import Continue from "./continue";
import Favorites from "./favorites";
import History from "./history";
import Notifications from "./notifications";
import AdminChat from "./adminChat";
import Settings from "./settings";
import Thema from "./thema";
import Watchlist from "./watchlist";
import Users from "./users";
import Comments from "./comments";
import Reports from "./reports";
import Schedule from "./schedule";
import Banners from "./banners";
import Logs from "./logs";

interface AdminPageProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const sections = [
  { id: "dashboard", icon: "⬛", label: "Дашборд" },
  { id: "anime", icon: "🎬", label: "Аниме" },
  { id: "users", icon: "👥", label: "Пользователи" },
  { id: "comments", icon: "💬", label: "Комментарии" },
  { id: "reports", icon: "🚨", label: "Жалобы" },
  { id: "schedule", icon: "📅", label: "Расписание" },
  { id: "banners", icon: "🖼️", label: "Баннеры" },
  { id: "logs", icon: "📋", label: "Логи" },
  { id: "continue", icon: "📺", label: "Продолжить" },
  { id: "favorites", icon: "⭐", label: "Избранное" },
  { id: "history", icon: "📜", label: "История" },
  { id: "watchlist", icon: "📋", label: "Отложенное" },
  { id: "chat", icon: "💬", label: "Чат" },
  { id: "notifications", icon: "🔔", label: "Уведомления" },
  { id: "thema", icon: "🎨", label: "Темы" },
  { id: "settings", icon: "⚙️", label: "Настройки" },
];

const animeGenres = [
  "Китайское", "3D", "Безумие", "Боевые искусства", "Вампиры", "Военное", "Гарем", "Гурман", "Дзёсей", "Демоны",
  "Детектив", "Детское", "Драма", "Игры", "Исторический", "Комедия", "Космос", "Машины", "Меха", "Музыка",
  "Пародия", "Повседневность", "Полиция", "Приключения", "Психологическое", "Романтика", "Работа", "Сёнен",
  "Сэйнэн", "Сёдзё", "Самураи", "Сверхъестественное", "Спорт", "Супер сила", "Ужасы", "Фантастика", "Фэнтези",
  "Школа", "Экшен", "Триллер",
];

const animeTypes = ["TV Сериал", "OVA", "ONA", "Компиляция", "Аниме Фильмы"];
const animeCategories = ["TV Сериал", "OVA", "ONA", "Фильм", "Спешл", "Короткометражка"];
type AnimeEpisodeDraft = { number: string; title: string; videoUrl: string; source: "upload" | "url" };

const activityColors: Record<string, string> = {
  anime: "#a855f7",
  moderation: "#f87171",
  system: "#22d3ee",
  settings: "#fbbf24",
  episodes: "#4ade80",
};

export default function AdminPage({ onNavigate }: AdminPageProps) {
  const [section, setSection] = useState(() => localStorage.getItem("animeSuAdminSection") || "dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAddAnimeForm, setShowAddAnimeForm] = useState(false);
  const [animeImageIndex, setAnimeImageIndex] = useState(0);
  const [animeEntries, setAnimeEntries] = useState<any[]>(animeList);
  const [editingAnimeId, setEditingAnimeId] = useState<string | number | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string | number; title: string; cover: string } | null>(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    newUsersToday: 0,
    totalAnime: animeList.length,
    newAnimeToday: 0,
    pendingComments: 0,
    pendingReports: 0,
    totalViews: animeList.reduce((total, anime) => total + Number(anime.views || 0), 0),
    viewsToday: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [moderationComments, setModerationComments] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [adminDataLoading, setAdminDataLoading] = useState(false);
  const [adminDataError, setAdminDataError] = useState<string | null>(null);
  const [adminCollection, setAdminCollection] = useState<any[]>([]);
  const recentlyAddedAnime = ([...animeList] as any[])
    .filter((anime) => anime.createdByAdmin)
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : Number(a.id) || 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : Number(b.id) || 0;
      return dateB - dateA;
    })
    .slice(0, 6);

  useEffect(() => {
    let active = true;
    const loadDashboardStats = async () => {
      setStatsLoading(true);
      const result = await adminApi.getDashboardStats();
      if (active && result.success) {
        const stats = ((result.stats || result.data || result) as Record<string, unknown>);
        setDashboardStats((current) => ({
          ...current,
          totalUsers: Number(stats.totalUsers ?? current.totalUsers),
          newUsersToday: Number(stats.newUsersToday ?? current.newUsersToday),
          totalAnime: Number(stats.totalAnime ?? current.totalAnime),
          newAnimeToday: Number(stats.newAnimeToday ?? current.newAnimeToday),
          totalViews: Number(stats.totalViews ?? current.totalViews),
          viewsToday: Number(stats.viewsToday ?? current.viewsToday),
          pendingReports: Number(stats.pendingReports ?? current.pendingReports),
          pendingComments: Number(stats.pendingComments ?? current.pendingComments),
        }));
      }
      if (active) setStatsLoading(false);
    };
    loadDashboardStats();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const loadSectionData = async () => {
      if (!["users", "comments", "reports", "schedule", "banners", "logs"].includes(section)) return;
      setAdminDataLoading(true);
      setAdminDataError(null);
      try {
        if (section === "users") {
          const result = await adminApi.getUsers(userSearch);
          if (!result.success) throw new Error(result.error || "Не удалось загрузить пользователей");
          if (active) setUsers((result.users || result.data || []) as any[]);
        }
        if (section === "comments") {
          const result = await adminApi.getComments();
          if (!result.success) throw new Error(result.error || "Не удалось загрузить комментарии");
          if (active) setModerationComments((result.comments || result.data || []) as any[]);
        }
        if (section === "reports") {
          const result = await adminApi.getReports();
          if (!result.success) throw new Error(result.error || "Не удалось загрузить жалобы");
          if (active) setReports((result.reports || result.data || []) as any[]);
        }
        if (section === "schedule" || section === "banners" || section === "logs") {
          const result = section === "schedule" ? await adminApi.getSchedule() : section === "banners" ? await adminApi.getBanners() : await adminApi.getLogs();
          if (!result.success) throw new Error(result.error || "Не удалось загрузить данные раздела");
          if (active) setAdminCollection((result.items || result.data || []) as any[]);
        }
      } catch (error) {
        if (active) {
          setAdminDataError(error instanceof Error ? error.message : "Нет подключения к API админ-панели");
          if (section === "users") setUsers([]);
          if (section === "comments") setModerationComments([]);
          if (section === "reports") setReports([]);
          if (["schedule", "banners", "logs"].includes(section)) setAdminCollection([]);
        }
      } finally {
        if (active) setAdminDataLoading(false);
      }
    };
    loadSectionData();
    return () => { active = false; };
  }, [section, userSearch]);
  const [animeForm, setAnimeForm] = useState({
    name: "",
    author: "",
    imageUrl: "",
    videoUrl: "",
    animeUrl: "",
    originalAnimeUrl: "",
    releaseDate: "",
    genres: [] as string[],
    type: "TV Сериал",
    category: "TV Сериал",
    status: "ongoing",
    description: "",
    downloadLinks: "",
    onlineLinks: "",
    schedule: "",
    scheduleDate: "",
    scheduleDay: "",
    countdown: "",
    publicationAt: "",
    episodes: "",
    seasons: "",
    rating: "",
    year: "",
    deviceVideos: [] as string[],
    remoteVideos: "",
    episodesList: [] as AnimeEpisodeDraft[],
    images: [] as Array<{ id: string; name: string; url: string }>,
  });

  const resetAnimeForm = () => {
    setEditingAnimeId(null);
    setAnimeImageIndex(0);
    setAnimeForm({
      name: "",
      author: "",
      imageUrl: "",
      videoUrl: "",
      animeUrl: "",
      originalAnimeUrl: "",
      releaseDate: "",
      genres: [],
      type: "TV Сериал",
      category: "TV Сериал",
      status: "ongoing",
      description: "",
      downloadLinks: "",
      onlineLinks: "",
      schedule: "",
      scheduleDate: "",
      scheduleDay: "",
      countdown: "",
      publicationAt: "",
      episodes: "",
      seasons: "",
      rating: "",
      year: "",
      deviceVideos: [],
      remoteVideos: "",
      episodesList: [],
      images: [],
    });
  };

  const openAnimeEditor = (anime: any) => {
    const normalizedGenreList = Array.isArray(anime.genres) ? anime.genres : [];
    const imageList = Array.isArray(anime.images) && anime.images.length
      ? anime.images
      : anime.cover
        ? [{ id: String(anime.id || Date.now()), name: anime.title || "cover", url: anime.cover }]
        : [];

    setEditingAnimeId(anime.id ?? null);
    setAnimeForm({
      name: anime.title || anime.name || "",
      author: anime.author || "",
      imageUrl: anime.imageUrl || "",
      videoUrl: anime.videoUrl || "",
      animeUrl: anime.animeUrl || "",
      originalAnimeUrl: anime.originalAnimeUrl || "",
      releaseDate: anime.releaseDate ? String(anime.releaseDate).slice(0, 10) : (anime.year ? `${anime.year}-01-01` : ""),
      genres: normalizedGenreList,
      type: anime.type || anime.category || "TV Сериал",
      category: anime.category || anime.type || "TV Сериал",
      status: anime.status || "ongoing",
      description: anime.description || "",
      downloadLinks: Array.isArray(anime.downloadLinks) ? anime.downloadLinks.join("\n") : "",
      onlineLinks: Array.isArray(anime.onlineLinks) ? anime.onlineLinks.join("\n") : "",
      schedule: anime.schedule || "",
      scheduleDate: anime.scheduleDate ? String(anime.scheduleDate).slice(0, 10) : "",
      scheduleDay: anime.scheduleDay || "",
      countdown: anime.countdown || "",
      publicationAt: anime.publicationAt ? String(anime.publicationAt).slice(0, 16) : "",
      episodes: String(anime.episodes ?? ""),
      seasons: String(anime.seasons ?? ""),
      rating: String(anime.score ?? anime.rating ?? ""),
      year: String(anime.year ?? ""),
      deviceVideos: Array.isArray(anime.deviceVideos) ? anime.deviceVideos : [],
      remoteVideos: Array.isArray(anime.remoteVideos) ? anime.remoteVideos.join("\n") : "",
      episodesList: Array.isArray(anime.episodesList) ? anime.episodesList.map((episode: any) => ({
        number: String(episode.number || ""),
        title: String(episode.title || ""),
        videoUrl: String(episode.videoUrl || ""),
        source: episode.source === "upload" ? "upload" : "url",
      })) : [],
      images: imageList,
    });
    setAnimeImageIndex(0);
    setShowAddAnimeForm(true);
  };

  const uploadAnimeMedia = async (files: FileList | File[], kind: "image" | "video") => {
    const fileArray = Array.from(files || []);
    if (!fileArray.length) return [];

    try {
      const result = await database.uploadAnimeMedia(fileArray, kind);
      if (!result.success || !result.data) {
        throw new Error(result.error || `Ошибка загрузки ${kind === "image" ? "изображений" : "видео"}`);
      }
      return result.data;
    } catch (error) {
      console.error("Backend upload failed; media was not saved:", error);
      alert(error instanceof Error ? error.message : "Не удалось сохранить файл в uploads/anime");
      return [];
    }
  };

  const handleSaveAnime = async () => {
    if (!animeForm.name.trim()) {
      alert("Укажите название аниме");
      return;
    }

    const payload = {
      name: animeForm.name,
      title: animeForm.name,
      author: animeForm.author,
      imageUrl: animeForm.imageUrl,
      videoUrl: animeForm.videoUrl,
      animeUrl: animeForm.animeUrl,
      originalAnimeUrl: animeForm.originalAnimeUrl,
      releaseDate: animeForm.releaseDate || null,
      genres: animeForm.genres.length ? animeForm.genres : ["Экшен"],
      type: animeForm.type,
      category: animeForm.category || animeForm.type,
      status: animeForm.status,
      description: animeForm.description,
      downloadLinks: animeForm.downloadLinks.split(/\r?\n/).filter(Boolean),
      onlineLinks: animeForm.onlineLinks.split(/\r?\n/).filter(Boolean),
      schedule: animeForm.schedule,
      scheduleDate: animeForm.scheduleDate || null,
      scheduleDay: animeForm.scheduleDay || (animeForm.scheduleDate ? new Date(`${animeForm.scheduleDate}T12:00:00`).getDay() : ""),
      countdown: animeForm.countdown,
      publicationAt: animeForm.publicationAt || null,
      episodes: Number(animeForm.episodes || 12),
      seasons: Number(animeForm.seasons || 1),
      rating: Number(animeForm.rating || 0),
      score: Number(animeForm.rating || 0),
      year: Number((animeForm.releaseDate || `${new Date().getFullYear()}-01-01`).slice(0, 4)),
      deviceVideos: animeForm.deviceVideos,
      remoteVideos: animeForm.remoteVideos.split(/\r?\n/).filter(Boolean),
      episodesList: animeForm.episodesList.map((episode) => ({
        number: Number(episode.number),
        title: episode.title || `Серия ${episode.number}`,
        videoUrl: episode.videoUrl,
        source: episode.source,
      })).filter((episode) => episode.number > 0 && episode.videoUrl),
      images: animeForm.images,
      cover: animeForm.imageUrl || animeForm.images[0]?.url || "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=80",
      studio: "AnimeSu Studio",
    };

    const isEditing = editingAnimeId !== null;
    let savedItem: any = null;

    try {
      const result = await database.saveAnime(payload as any, isEditing ? String(editingAnimeId) : undefined);
      if (!result.success || !result.data) {
        throw new Error(result.error || "Ошибка сохранения аниме");
      }
      savedItem = result.data;
    } catch (error) {
      console.warn("Backend save unavailable, using local fallback:", error);
      savedItem = {
        ...payload,
        _id: editingAnimeId || Date.now(),
        title: animeForm.name,
        status: animeForm.status,
        cover: payload.cover,
        score: payload.score,
        year: payload.year,
      };
    }

    const normalizedEntry = {
      id: savedItem?._id || savedItem?.id || editingAnimeId || Date.now(),
      title: savedItem?.title || savedItem?.name || animeForm.name,
      year: Number(savedItem?.year || payload.year || new Date().getFullYear()),
      score: Number(savedItem?.score || payload.score || 0),
      genres: savedItem?.genres || payload.genres || ["Экшен"],
      cover: savedItem?.cover || payload.cover || "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=80",
      status: savedItem?.status === "ongoing" || savedItem?.status === "completed" || savedItem?.status === "announced" ? savedItem.status : payload.status,
      episodes: Number(savedItem?.episodes || payload.episodes || 12),
      episodesAired: Number(savedItem?.episodesAired || Math.max(1, Number(savedItem?.episodes || payload.episodes || 1))),
      isNew: Boolean(savedItem?.isNew),
      studio: savedItem?.studio || "AnimeSu Studio",
      description: savedItem?.description || payload.description || "",
      category: savedItem?.category || payload.category || animeForm.category,
      type: savedItem?.type || payload.type || animeForm.type,
      banner: savedItem?.banner || payload.images?.[0]?.url || payload.cover || "",
      images: Array.isArray(savedItem?.images) ? savedItem.images : payload.images,
      deviceVideos: Array.isArray(savedItem?.deviceVideos) ? savedItem.deviceVideos : payload.deviceVideos,
      remoteVideos: Array.isArray(savedItem?.remoteVideos) ? savedItem.remoteVideos : payload.remoteVideos,
      episodesList: Array.isArray(savedItem?.episodesList) ? savedItem.episodesList : payload.episodesList,
      downloadLinks: Array.isArray(savedItem?.downloadLinks) ? savedItem.downloadLinks : payload.downloadLinks,
      onlineLinks: Array.isArray(savedItem?.onlineLinks) ? savedItem.onlineLinks : payload.onlineLinks,
      originalAnimeUrl: savedItem?.originalAnimeUrl || payload.originalAnimeUrl,
      animeUrl: savedItem?.animeUrl || payload.animeUrl,
      videoUrl: savedItem?.videoUrl || payload.videoUrl,
      imageUrl: savedItem?.imageUrl || payload.imageUrl,
      releaseDate: savedItem?.releaseDate || payload.releaseDate,
      schedule: savedItem?.schedule || payload.schedule,
      scheduleDate: savedItem?.scheduleDate || payload.scheduleDate,
      scheduleDay: savedItem?.scheduleDay || payload.scheduleDay,
      publicationAt: savedItem?.publicationAt || payload.publicationAt,
      countdown: savedItem?.countdown || payload.countdown,
      createdAt: savedItem?.createdAt || new Date().toISOString(),
    };

    if (isEditing) {
      setAnimeEntries((prev) => prev.map((entry) => String(entry.id) === String(editingAnimeId) ? { ...entry, ...normalizedEntry } : entry));
      const inMemoryTarget = animeList.findIndex((entry) => String(entry.id) === String(editingAnimeId));
      if (inMemoryTarget >= 0) {
        animeList.splice(inMemoryTarget, 1, { ...animeList[inMemoryTarget], ...normalizedEntry });
        appendAnimeItem(animeList[inMemoryTarget]);
      }
    } else {
      setAnimeEntries((prev) => [normalizedEntry, ...prev]);
      appendAnimeItem(savedItem || payload);
    }

    setShowAddAnimeForm(false);
    resetAnimeForm();
  };

  const handleDeleteAnime = async (animeId: string | number) => {
    try {
      const result = await database.deleteAnime(String(animeId));
      if (!result.success && result.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.warn("Backend delete failed; removing locally only:", error);
    }

    const localIndex = animeList.findIndex((entry) => String(entry.id) === String(animeId));
    if (localIndex >= 0) {
      animeList.splice(localIndex, 1);
    }

    setAnimeEntries((prev) => prev.filter((entry) => String(entry.id) !== String(animeId)));
  };

  const requestDeleteAnime = (anime: { id: string | number; title: string; cover: string }) => {
    setDeleteCandidate(anime);
  };

  const StatCard = ({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) => (
    <div className="rounded p-5" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</p>
      <p className="mt-1" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, color: color ?? "#e8e8f0", letterSpacing: "0.04em" }}>{value}</p>
      {sub && <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", marginTop: 2 }}>{sub}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex pt-14" style={{ background: "var(--background)" }}>
      {/* Sidebar */}
      <aside
        className="flex-shrink-0 flex flex-col pt-4 pb-8"
        style={{
          width: sidebarOpen ? 220 : 60,
          background: "rgba(13,13,20,0.95)",
          borderRight: "1px solid rgba(124,58,237,0.15)",
          transition: "width 0.2s ease",
          overflow: "hidden",
        }}
      >
        <div className="flex items-center justify-between px-4 mb-6">
          {sidebarOpen && (
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "#a855f7", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              ADMIN
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded transition-all ml-auto"
            style={{ background: "rgba(124,58,237,0.1)", color: "#a855f7" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarOpen ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
            </svg>
          </button>
        </div>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => {
              setSection(s.id);
              localStorage.setItem("animeSuAdminSection", s.id);
            }}
            className="flex items-center gap-3 px-4 py-2.5 w-full transition-all text-left"
            style={{
              background: section === s.id ? "rgba(124,58,237,0.12)" : "transparent",
              borderLeft: section === s.id ? "2px solid #a855f7" : "2px solid transparent",
              color: section === s.id ? "#a855f7" : "#6b6b8a",
            }}
          >
            <span style={{ fontSize: 14, flexShrink: 0 }}>{s.icon}</span>
            {sidebarOpen && (
              <span style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: section === s.id ? 700 : 400, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                {s.label}
              </span>
            )}
          </button>
        ))}

        {sidebarOpen && (
          <div className="mt-auto px-4">
            <button
              onClick={() => onNavigate("home")}
              className="w-full py-2 rounded text-xs transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#6b6b8a", fontFamily: "var(--font-display)", letterSpacing: "0.06em" }}
            >
              ← НА САЙТ
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        {section === "dashboard" && (
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 24 }}>
              ДАШБОРД
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard label="Пользователи" value={statsLoading ? "..." : dashboardStats.totalUsers.toLocaleString("ru")} sub={`+${dashboardStats.newUsersToday} сегодня`} color="#a855f7" />
              <StatCard label="Всего аниме" value={statsLoading ? "..." : dashboardStats.totalAnime.toLocaleString("ru")} sub={`+${dashboardStats.newAnimeToday} сегодня`} color="#22d3ee" />
              <StatCard label="Просмотры" value={statsLoading ? "..." : (dashboardStats.totalViews / 1_000_000).toFixed(1) + "M"} sub={`+${(dashboardStats.viewsToday / 1000).toFixed(0)}к сегодня`} color="#4ade80" />
              <StatCard label="Жалобы" value={statsLoading ? "..." : dashboardStats.pendingReports} sub={`${dashboardStats.pendingComments} комментариев`} color="#f87171" />
            </div>

            {/* Activity log */}
            <div className="rounded p-5" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
                Последние действия
              </h3>
              {recentlyAddedAnime.length > 0 && (
                <div className="mb-6">
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                    Добавленные аниме
                  </p>
                  <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollSnapType: "x mandatory" }}>
                    {recentlyAddedAnime.map((anime) => (
                      <AnimeCard key={anime.id} anime={anime} onClick={() => onNavigate("anime", anime)} size="sm" />
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-3">
                {adminRecentActivity.map(a => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: activityColors[a.type] ?? "#6b6b8a" }} />
                    <div className="flex-1">
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, color: activityColors[a.type] ?? "#a0a0b8" }}>{a.user}</span>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#a0a0b8" }}> — {a.action}</span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", flexShrink: 0 }}>{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {section === "anime" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase" }}>УПРАВЛЕНИЕ АНИМЕ</h2>
              <button
                onClick={() => setShowAddAnimeForm(true)}
                className="px-4 py-2 rounded text-sm font-semibold transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", fontFamily: "var(--font-display)", letterSpacing: "0.06em" }}
              >
                + ДОБАВИТЬ
              </button>
            </div>

            {showAddAnimeForm && (
              <div className="mb-8 rounded-2xl p-4 md:p-6 shadow-2xl" style={{ background: "rgba(17,17,25,0.98)", border: "1px solid rgba(168,85,247,0.25)", boxShadow: "0 20px 60px rgba(124,58,237,0.18)" }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {editingAnimeId !== null ? "Редактировать аниме" : "Добавить аниме"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddAnimeForm(false);
                      resetAnimeForm();
                    }}
                    className="px-3 py-1.5 rounded text-xs"
                    style={{ background: "rgba(255,255,255,0.04)", color: "#a0a0b8", fontFamily: "var(--font-mono)" }}
                  >
                    Закрыть
                  </button>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                  <div className="space-y-5">
                    <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(124,58,237,0.12)" }}>
                      <div className="flex items-center justify-between mb-3">
                        <span style={{ fontFamily: "var(--font-display)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b6b8a" }}>Галерея</span>
                        <label className="px-3 py-1.5 rounded text-xs cursor-pointer" style={{ background: "rgba(124,58,237,0.15)", color: "#d6b5ff", fontFamily: "var(--font-mono)" }}>
                          + Загрузить
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={async (event) => {
                              const files = event.target.files;
                              if (!files?.length) return;

                              try {
                                const uploaded = await uploadAnimeMedia(files, "image");
                                const newImages = uploaded
                                  .filter(file => file.type === "image")
                                  .map((file) => ({
                                    id: file.id,
                                    name: file.name,
                                    url: file.url,
                                  }));

                                if (newImages.length > 0) {
                                  setAnimeForm((prev) => ({
                                    ...prev,
                                    images: [...prev.images, ...newImages],
                                  }));
                                  setAnimeImageIndex((prev) => Math.max(0, prev));
                                }
                              } catch (error) {
                                console.error("Image upload failed:", error);
                              }

                              event.target.value = "";
                            }}
                          />
                        </label>
                      </div>

                      {animeForm.images.length > 0 ? (
                        <div>
                          <div className="relative overflow-hidden rounded-xl border border-purple-500/25" style={{ aspectRatio: "16 / 9", background: "rgba(20,20,32,0.9)" }}>
                            <img
                              src={animeForm.images[animeImageIndex]?.url}
                              alt={animeForm.images[animeImageIndex]?.name ?? "Anime preview"}
                              className="h-full w-full object-cover"
                            />

                            {animeForm.images.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setAnimeImageIndex((prev) => (prev === 0 ? animeForm.images.length - 1 : prev - 1))}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full w-9 h-9 text-lg"
                                  style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}
                                >
                                  ‹
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAnimeImageIndex((prev) => (prev + 1) % animeForm.images.length)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full w-9 h-9 text-lg"
                                  style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}
                                >
                                  ›
                                </button>
                              </>
                            )}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {animeForm.images.map((image, index) => (
                              <button
                                type="button"
                                key={image.id}
                                onClick={() => setAnimeImageIndex(index)}
                                className="relative h-16 w-16 overflow-hidden rounded-md border"
                                style={{
                                  borderColor: index === animeImageIndex ? "#a855f7" : "rgba(255,255,255,0.08)",
                                  boxShadow: index === animeImageIndex ? "0 0 0 1px rgba(168,85,247,0.8)" : "none",
                                }}
                              >
                                <img src={image.url} alt={image.name} className="h-full w-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-purple-500/30 bg-black/20 text-center" style={{ borderStyle: "dashed" }}>
                          <div>
                            <div className="text-4xl mb-2">🖼️</div>
                            <p style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "#a0a0b8", letterSpacing: "0.06em", textTransform: "uppercase" }}>Добавьте постер и скриншоты</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                        Имя аниме
                      </label>
                      <input
                        type="text"
                        value={animeForm.name}
                        onChange={(event) => setAnimeForm((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder="Например: Блич: Тысячелетняя кровавая война"
                        className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, display: "block" }}>
                        Жанр
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {animeGenres.map((genre) => {
                          const isSelected = animeForm.genres.includes(genre);
                          return (
                            <button
                              type="button"
                              key={genre}
                              onClick={() =>
                                setAnimeForm((prev) => ({
                                  ...prev,
                                  genres: isSelected
                                    ? prev.genres.filter((item) => item !== genre)
                                    : [...prev.genres, genre],
                                }))
                              }
                              className="px-3 py-1.5 rounded-full text-xs transition-all"
                              style={{
                                background: isSelected ? "rgba(168,85,247,0.22)" : "rgba(255,255,255,0.03)",
                                color: isSelected ? "#f0d8ff" : "#8d8da8",
                                border: isSelected ? "1px solid rgba(168,85,247,0.45)" : "1px solid rgba(255,255,255,0.08)",
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              {genre}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                        Автор
                      </label>
                      <input
                        type="text"
                        value={animeForm.author}
                        onChange={(event) => setAnimeForm((prev) => ({ ...prev, author: event.target.value }))}
                        placeholder="Имя автора или студии"
                        className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                      />
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                          Тип
                        </label>
                        <select
                          value={animeForm.type}
                          onChange={(event) => setAnimeForm((prev) => ({ ...prev, type: event.target.value }))}
                          className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                        >
                          {animeTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                          Категория
                        </label>
                        <select
                          value={animeForm.category}
                          onChange={(event) => setAnimeForm((prev) => ({ ...prev, category: event.target.value }))}
                          className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                        >
                          {animeCategories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                          Статус
                        </label>
                        <select
                          value={animeForm.status}
                          onChange={(event) => setAnimeForm((prev) => ({ ...prev, status: event.target.value }))}
                          className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                        >
                          <option value="ongoing">Онгоинг</option>
                          <option value="completed">Завершён</option>
                          <option value="announced">Анонс</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                          Количество серий
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={animeForm.episodes}
                          onChange={(event) => setAnimeForm((prev) => ({ ...prev, episodes: event.target.value }))}
                          className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                        />
                      </div>

                      <div>
                        <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                          Количество сезонов
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={animeForm.seasons}
                          onChange={(event) => setAnimeForm((prev) => ({ ...prev, seasons: event.target.value }))}
                          className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                        />
                      </div>

                      <div>
                        <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                          Рейтинг
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={0.1}
                          value={animeForm.rating}
                          onChange={(event) => setAnimeForm((prev) => ({ ...prev, rating: event.target.value }))}
                          className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                        />
                      </div>

                      <div>
                        <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                          Год выхода
                        </label>
                        <input
                          type="date"
                          value={animeForm.releaseDate}
                          onChange={(event) => setAnimeForm((prev) => ({ ...prev, releaseDate: event.target.value }))}
                          className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                        Описание аниме
                      </label>
                      <textarea
                        value={animeForm.description}
                        onChange={(event) => setAnimeForm((prev) => ({ ...prev, description: event.target.value }))}
                        rows={5}
                        placeholder="Напишите краткое и подробное описание аниме..."
                        className="w-full px-4 py-3 rounded-xl outline-none transition-all resize-none"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {[
                        ["imageUrl", "Ссылка на картинку", "https://example.com/poster.jpg"],
                        ["videoUrl", "Ссылка на видео", "https://example.com/video.mp4"],
                        ["animeUrl", "Ссылка на аниме", "https://example.com/anime"],
                        ["originalAnimeUrl", "Ссылка на аниме в оригинале", "https://example.com/original"],
                      ].map(([field, label, placeholder]) => (
                        <div key={field}>
                          <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                            {label}
                          </label>
                          <input
                            type="url"
                            value={animeForm[field as keyof typeof animeForm] as string}
                            onChange={(event) => setAnimeForm((prev) => ({ ...prev, [field]: event.target.value }))}
                            placeholder={placeholder}
                            className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                          Ссылки скачать
                        </label>
                        <textarea
                          value={animeForm.downloadLinks}
                          onChange={(event) => setAnimeForm((prev) => ({ ...prev, downloadLinks: event.target.value }))}
                          rows={3}
                          placeholder="https://example.com/stream1\nhttps://example.com/stream2"
                          className="w-full px-4 py-3 rounded-xl outline-none transition-all resize-none"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                        />
                      </div>

                      <div>
                        <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                          Ссылки смотреть онлайн
                        </label>
                        <textarea
                          value={animeForm.onlineLinks}
                          onChange={(event) => setAnimeForm((prev) => ({ ...prev, onlineLinks: event.target.value }))}
                          rows={3}
                          placeholder="https://example.com/watch1\nhttps://example.com/watch2"
                          className="w-full px-4 py-3 rounded-xl outline-none transition-all resize-none"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                          Расписание / дата выхода
                        </label>
                        <input
                          type="date"
                          value={animeForm.scheduleDate}
                          onChange={(event) => setAnimeForm((prev) => ({
                            ...prev,
                            scheduleDate: event.target.value,
                            schedule: event.target.value,
                            scheduleDay: event.target.value ? String(new Date(`${event.target.value}T12:00:00`).getDay()) : "",
                          }))}
                          className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                        />
                        <select
                          value={animeForm.scheduleDay}
                          onChange={(event) => setAnimeForm((prev) => ({ ...prev, scheduleDay: event.target.value }))}
                          className="mt-2 w-full px-4 py-3 rounded-xl outline-none transition-all"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                          aria-label="День регулярного выхода"
                        >
                          <option value="">Выберите день регулярного выхода</option>
                          {[[1, "Понедельник"], [2, "Вторник"], [3, "Среда"], [4, "Четверг"], [5, "Пятница"], [6, "Суббота"], [0, "Воскресенье"]].map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                          Обратный отсчёт / публикация
                        </label>
                        <input
                          type="datetime-local"
                          value={animeForm.publicationAt}
                          onChange={(event) => setAnimeForm((prev) => ({ ...prev, publicationAt: event.target.value, countdown: event.target.value }))}
                          className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                        />
                      </div>
                    </div>

                    <div className="rounded-xl p-4" style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.18)" }}>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p style={{ fontFamily: "var(--font-display)", color: "#e8e8f0", fontSize: 14, fontWeight: 700 }}>Серии и видео</p>
                          <p style={{ color: "#6b6b8a", fontSize: 11 }}>Для каждой серии укажите номер и выберите файл с устройства или вставьте ссылку.</p>
                        </div>
                        <button type="button" onClick={() => setAnimeForm((prev) => ({ ...prev, episodesList: [...prev.episodesList, { number: String(prev.episodesList.length + 1), title: `Серия ${prev.episodesList.length + 1}`, videoUrl: "", source: "url" }] }))} className="rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(168,85,247,0.18)", border: "1px solid rgba(168,85,247,0.35)", color: "#d6b5ff" }}>
                          + Добавить серию
                        </button>
                      </div>
                      <div className="space-y-3">
                        {animeForm.episodesList.map((episode, index) => (
                          <div key={`episode-${index}`} className="grid gap-2 md:grid-cols-[90px_1fr_1.5fr_auto] items-center">
                            <input type="number" min={1} value={episode.number} onChange={(event) => setAnimeForm((prev) => ({ ...prev, episodesList: prev.episodesList.map((item, itemIndex) => itemIndex === index ? { ...item, number: event.target.value } : item) }))} placeholder="№" className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0" }} />
                            <input type="text" value={episode.title} onChange={(event) => setAnimeForm((prev) => ({ ...prev, episodesList: prev.episodesList.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item) }))} placeholder="Название серии" className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0" }} />
                            <input type="url" value={episode.videoUrl} onChange={(event) => setAnimeForm((prev) => ({ ...prev, episodesList: prev.episodesList.map((item, itemIndex) => itemIndex === index ? { ...item, videoUrl: event.target.value, source: "url" } : item) }))} placeholder="Ссылка или файл" className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0" }} />
                            <div className="flex items-center gap-2">
                              <label className="cursor-pointer rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(255,255,255,0.06)", color: "#c4b5fd" }}>
                                Файл
                                <input type="file" accept="video/*" className="hidden" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; const uploaded = await uploadAnimeMedia([file], "video"); const url = uploaded[0]?.url; if (url) setAnimeForm((prev) => ({ ...prev, episodesList: prev.episodesList.map((item, itemIndex) => itemIndex === index ? { ...item, videoUrl: url, source: "upload" } : item) })); event.target.value = ""; }} />
                              </label>
                              <button type="button" onClick={() => setAnimeForm((prev) => ({ ...prev, episodesList: prev.episodesList.filter((_, itemIndex) => itemIndex !== index) }))} className="rounded-lg px-2 py-2 text-xs" style={{ color: "#f87171", background: "rgba(248,113,113,0.08)" }} aria-label="Удалить серию">×</button>
                            </div>
                          </div>
                        ))}
                        {!animeForm.episodesList.length && <p style={{ color: "#6b6b8a", fontSize: 12 }}>Серии ещё не добавлены.</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddAnimeForm(false);
                      resetAnimeForm();
                    }}
                    className="px-5 py-2.5 rounded-xl text-sm"
                    style={{ background: "rgba(255,255,255,0.04)", color: "#a0a0b8", fontFamily: "var(--font-display)" }}
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAnime}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", fontFamily: "var(--font-display)" }}
                  >
                    Сохранить аниме
                  </button>
                </div>
              </div>
            )}

            <div className="rounded overflow-hidden" style={{ border: "1px solid rgba(124,58,237,0.12)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "rgba(124,58,237,0.08)", borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
                    {["Обложка", "Название", "Год", "Статус", "Оценка", "Действия"].map(h => (
                      <th key={h} className="px-4 py-3 text-left" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {animeEntries.map((a, i) => (
                    <tr key={a.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                      <td className="px-4 py-3">
                        <img src={a.cover} alt={a.title} className="w-8 h-11 object-cover rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <p style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "#e8e8f0", fontWeight: 600 }}>{a.title}</p>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a" }}>{a.studio}</p>
                      </td>
                      <td className="px-4 py-3" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#a0a0b8" }}>{a.year}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs" style={{
                          background: a.status === "ongoing" ? "rgba(34,211,238,0.1)" : a.status === "completed" ? "rgba(74,222,128,0.1)" : "rgba(251,191,36,0.1)",
                          color: a.status === "ongoing" ? "#22d3ee" : a.status === "completed" ? "#4ade80" : "#fbbf24",
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
                        }}>
                          {a.status === "ongoing" ? "Онгоинг" : a.status === "completed" ? "Завершён" : "Анонс"}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#fbbf24" }}>{a.score > 0 ? a.score : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openAnimeEditor(a)}
                            className="px-2 py-1 rounded text-xs transition-all"
                            style={{ background: "rgba(124,58,237,0.1)", color: "#a855f7", fontFamily: "var(--font-mono)", fontSize: 10 }}
                          >
                            Ред.
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDeleteAnime(a)}
                            className="px-2 py-1 rounded text-xs transition-all"
                            style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", fontFamily: "var(--font-mono)", fontSize: 10 }}
                          >
                            Удал.
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {section === "users" && <Users onNavigate={onNavigate} />}

        {section === "comments" && <Comments onNavigate={onNavigate} />}

        {section === "reports" && <Reports onNavigate={onNavigate} />}

        {section === "schedule" && <Schedule onNavigate={onNavigate} />}

        {section === "banners" && <Banners onNavigate={onNavigate} />}

        {section === "logs" && <Logs onNavigate={onNavigate} />}

        {section === "continue" && <Continue onNavigate={onNavigate} />}
        {section === "favorites" && <Favorites onNavigate={onNavigate} />}
        {section === "history" && <History onNavigate={onNavigate} />}
        {section === "watchlist" && <Watchlist onNavigate={onNavigate} />}
        {section === "chat" && <AdminChat />}
        {section === "notifications" && <Notifications onNavigate={onNavigate} />}
        {section === "thema" && <Thema onNavigate={onNavigate} />}
        {section === "settings" && <Settings onNavigate={onNavigate} />}
        {false && (
          <div className="flex flex-col items-center justify-center h-64">
            <p style={{ fontFamily: "var(--font-display)", fontSize: 40, marginBottom: 16 }}>{sections.find(s => s.id === section)?.icon}</p>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "#e8e8f0", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {sections.find(s => s.id === section)?.label}
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a", marginTop: 8 }}>Раздел в разработке</p>
          </div>
        )}
      </main>

      {deleteCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(5,5,10,0.78)", backdropFilter: "blur(8px)" }}
          onClick={() => setDeleteCandidate(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-anime-title"
            className="w-full max-w-md overflow-hidden rounded-2xl"
            style={{ background: "linear-gradient(145deg, #1c1728, #11111a)", border: "1px solid rgba(248,113,113,0.32)", boxShadow: "0 24px 90px rgba(0,0,0,0.55)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="h-1" style={{ background: "linear-gradient(90deg, #f87171, #fb7185)" }} />
            <div className="p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(248,113,113,0.13)", color: "#f87171" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 9v4M12 17h.01" />
                    <path d="M10.3 3.8 2.9 17a2 2 0 0 0 1.75 3h14.7a2 2 0 0 0 1.75-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 id="delete-anime-title" style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "#f4f1f8", letterSpacing: "0.04em" }}>
                    Удалить аниме?
                  </h3>
                  <p className="mt-2" style={{ fontFamily: "var(--font-body)", fontSize: 13, lineHeight: 1.55, color: "#a0a0b8" }}>
                    Запись будет удалена из админки и базы данных. Это действие нельзя отменить.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <img src={deleteCandidate.cover} alt="" className="h-14 w-10 flex-shrink-0 rounded object-cover" />
                <span className="truncate" style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, color: "#e8e8f0" }}>{deleteCandidate.title}</span>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteCandidate(null)}
                  className="rounded-xl px-5 py-2.5 text-sm transition-all hover:bg-white/10"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#c4c1ce", fontFamily: "var(--font-display)" }}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const animeId = deleteCandidate.id;
                    setDeleteCandidate(null);
                    await handleDeleteAnime(animeId);
                  }}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg, #dc2626, #f87171)", color: "#fff", fontFamily: "var(--font-display)" }}
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
