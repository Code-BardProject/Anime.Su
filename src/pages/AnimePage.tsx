import { useEffect, useRef, useState } from "react";
import { animeList, incrementAnimeViews } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { SmileysAndEmotions } from "../emoji/Emoji";
import { adminApi } from "../../services/adminApi";

interface AnimePageProps {
  anime: {
    id: number;
    title: string;
    titleJp: string;
    titleEn: string;
    year: number;
    score: number;
    genres: string[];
    cover: string;
    banner: string;
    status: string;
    episodes: number;
    episodesAired: number;
    studio: string;
    description: string;
    views: number;
    type: string;
    deviceVideos?: string[];
    remoteVideos?: string[];
    videoUrl?: string;
    images?: Array<{ id?: string; name?: string; url?: string }>;
    episodesList?: Array<{ number: number; title?: string; videoUrl: string }>;
    subtitles?: Array<{ label: string; src: string; srclang?: string }>;
    audioTracks?: Array<{ label: string; src?: string }>;
    releaseDate?: string | null;
    scheduleDate?: string | null;
    scheduleDay?: string | number;
    publicationAt?: string | null;
    countdown?: string | null;
    downloadLinks?: string[];
    onlineLinks?: string[];
    originalAnimeUrl?: string;
  };
  onNavigate: (page: string, data?: unknown) => void;
}

const decorativeSymbols = [
  "𓅰 𓅬 𓅭 𓅮 𓅯", "▶• ılıılıılılılııılıılı. 0", "✎ ⋆⑅˚₊", ". ݁₊ ⊹ . 📽.ᐟ", "˗ˏˋ ★ ˎˊ˗",
  "✎ᝰ.", "ᯓ★", "⋆˚꩜｡", "𓆝 𓆟 𓆞 𓆝 𓆟", "𒅒𒈔𒅒𒇫𒄆", "𐦂𖨆𐀪𖠋", "⋆౨ৎ˚⟡˖ ࣪",
  "ִֶָ𓂃 ࣪˖ ִֶָ🐇་༘࿐", "-ˋˏ✄┈┈┈┈", "꧁⎝ 𓆩༺✧༻𓆪 ⎠꧂", "⌞ ⌝", "≽ܫ≼", "</>", "⏯",
  "⊹ ࣪ ﹏𓊝﹏𓂁﹏⊹ ࣪ ˖", "( -_•)︻デ═一", "⊹₊⟡⋆", "𓆉𓆝 𓆟 𓆞 𓆝 𓆟𓇼", "⋆｡ﾟ☁︎｡⋆｡ ﾟ☾ ﾟ｡⋆",
  "°❀⋆.ೃ࿔*:･", ".☘︎ ݁˖", "𐙚⋆°｡⋆♡", "(╥﹏╥)", "༘˚⋆𐙚｡⋆𖦹.✧˚", "❯❯❯❯", "⚡︎",
  "📽️₊˚.⋆☾⋆⁺₊✧🎭", "✐┈𝑨𝒓𝒕┈ᝰ", "𓏲ּ𝄢", "♡ ̆̈", "ᝰ.ᐟ", "♾️", "˙𐃷˙", "⇄",
  "˖ ݁♬⋆.˚𝄞", "🃜 🃚 🃖 🃁 🂭 🂺", "☀︎", "˚˖𓍢ִ໋❀", "☠", "𝐍𝐄𝐓𝐅𝐋𝐈𝐗", "ඞඞඞඞඞඞඞඞඞඞ",
  "✶⋆.˚ммммм", "[ ▸ ]", "*ੈ✩‧₊⟭⟬⁷༻*ੈ", "▄︻╦芫≡══--", "𖦹 ̫ 𖦹", "𖦹 ̫ 𖦹જ⁀➴",
];

const stickerAssets = {
  ...import.meta.glob<string>("../emoji/emojiimg/*.{gif,png}", { eager: true, import: "default", query: "?url" }),
};
const stickers = Object.entries(stickerAssets).map(([path, url]) => ({ name: path.split("/").pop() || "sticker.gif", url }));
const stickerCategoryIcon = new URL("../emoji/emojiimg/gificon.gif", import.meta.url).href;

type CommentItem = {
  id: string | number;
  animeId?: string;
  user: string;
  avatar: string;
  text: string;
  date: string;
  likes: number;
  sticker?: string;
};

const toCommentItem = (record: Record<string, unknown>, fallbackAnimeId?: number): CommentItem => {
  const author = record.userId && typeof record.userId === "object"
    ? record.userId as Record<string, unknown>
    : undefined;
  const userName = String(record.userName ?? author?.username ?? record.email ?? "Пользователь");
  const recordAnime = record.anime && typeof record.anime === "object"
    ? record.anime as Record<string, unknown>
    : undefined;

  return {
    id: String(record.id ?? record._id ?? `${fallbackAnimeId ?? "anime"}-${userName}-${record.createdAt ?? Date.now()}`),
    user: userName,
    avatar: String(record.avatar ?? author?.avatar ?? (userName.charAt(0).toUpperCase() || "U")),
    text: String(record.text ?? record.content ?? ""),
    date: record.createdAt ? new Date(String(record.createdAt)).toLocaleDateString("ru-RU") : "",
    likes: Number(record.likes ?? 0),
    sticker: typeof record.sticker === "string" ? record.sticker : undefined,
    animeId: String(record.animeId ?? recordAnime?.id ?? fallbackAnimeId ?? ""),
  };
};

export default function AnimePage({ anime, onNavigate }: AnimePageProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"episodes" | "comments" | "related">("episodes");
  const [inList, setInList] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [videoZoom, setVideoZoom] = useState(1);
  const [quality, setQuality] = useState("Авто");
  const [subtitle, setSubtitle] = useState("off");
  const [audioTrack, setAudioTrack] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoTime, setVideoTime] = useState(0);
  const [countdownNow, setCountdownNow] = useState(() => Date.now());
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentError, setCommentError] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState<"smileys" | "symbols" | "stickers">("smileys");
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoStageRef = useRef<HTMLDivElement | null>(null);
  const gallery = [
    anime.cover,
    anime.banner,
    ...(anime.images || []).map((image) => image.url).filter((url): url is string => Boolean(url)),
  ].filter((url, index, items) => Boolean(url) && items.indexOf(url) === index);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const activeImage = gallery[galleryIndex] || anime.cover || anime.banner;
  const canComment = Boolean(user && localStorage.getItem("animeSuAuthToken"));

  useEffect(() => {
    let active = true;

    const loadComments = async () => {
      const result = await adminApi.getComments();
      if (!active || !result.success) return;

      const records = Array.isArray(result.comments)
        ? result.comments
        : Array.isArray(result.data) ? result.data : [];
      const animeComments = records
        .filter((record): record is Record<string, unknown> => Boolean(record && typeof record === "object"))
        .filter((record) => String(record.animeId ?? (record.anime as Record<string, unknown> | undefined)?.id ?? "") === String(anime.id))
        .filter((record) => record.status !== "deleted")
        .map((record) => toCommentItem(record, anime.id));

      setComments(animeComments);
    };

    void loadComments();
    return () => {
      active = false;
    };
  }, [anime.id]);

  useEffect(() => {
    setGalleryIndex(0);
  }, [anime.id]);

  useEffect(() => {
    if (gallery.length < 2) return;
    const timer = window.setInterval(() => {
      setGalleryIndex((index) => (index + 1) % gallery.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [gallery.length, anime.id]);

  const related = animeList.filter(a => a.id !== anime.id && a.genres.some(g => anime.genres.includes(g))).slice(0, 4);

  const availableVideos = [...(anime.deviceVideos || []), ...(anime.remoteVideos || [])];
  const definedEpisodes = anime.episodesList || [];
  const episodeCount = Math.max(1, Math.min(
    anime.episodes || 1,
    Math.max(anime.episodesAired || 1, definedEpisodes.length, availableVideos.length || (anime.videoUrl ? 1 : 0)),
  ));
  const episodes = Array.from({ length: episodeCount }, (_, i) => ({
    num: i + 1,
    title: definedEpisodes.find((item) => item.number === i + 1)?.title || `Серия ${i + 1}`,
    aired: `${28 - i} авг 2026`,
    duration: "24 мин",
  }));
  const episodeEntries = anime.episodesList || [];
  const currentVideo = episodeEntries.find((item) => item.number === selectedEpisode)?.videoUrl
    || availableVideos[selectedEpisode - 1]
    || (selectedEpisode === 1 ? anime.videoUrl : "");
  const subtitles = anime.subtitles || [];
  const audioTracks = anime.audioTracks?.length ? anime.audioTracks.map((track) => track.label) : ["Оригинал", "Русская озвучка", "Субтитры"];
  const publicationTimestamp = anime.publicationAt ? new Date(anime.publicationAt).getTime() : 0;
  const countdownMs = publicationTimestamp - countdownNow;
  const countdownText = countdownMs > 0
    ? `${Math.floor(countdownMs / 86_400_000)}д ${Math.floor((countdownMs / 3_600_000) % 24)}ч ${Math.floor((countdownMs / 60_000) % 60)}м`
    : "Опубликовано";
  const scheduleDayLabels = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const scheduleLabel = anime.scheduleDay !== undefined && anime.scheduleDay !== ""
    ? `Каждую неделю: ${scheduleDayLabels[Number(anime.scheduleDay)] || ""}`
    : anime.scheduleDate
      ? `Дата выхода: ${new Date(`${anime.scheduleDate}T12:00:00`).toLocaleDateString("ru-RU")}`
      : "";

  const addComment = async () => {
    const text = comment.trim();
    const authToken = localStorage.getItem("animeSuAuthToken");
    if (!user || !authToken) {
      setCommentError("Войдите в зарегистрированный аккаунт, чтобы оставить комментарий.");
      return;
    }
    if (!text && !selectedSticker) {
      setCommentError("Введите текст или выберите стикер.");
      return;
    }
    if (commentSubmitting) return;

    setCommentError("");
    setCommentSubmitting(true);
    const apiText = text || "Стикер";

    try {
      const result = await adminApi.createComment({
        animeId: anime.id,
        animeTitle: anime.title,
        userId: user.id,
        userName: user.username || user.email,
        email: user.email,
        text: apiText,
        content: apiText,
        sticker: selectedSticker || undefined,
        episode: selectedEpisode,
        avatar: user.avatar,
      });
      if (!result.success) {
        setCommentError(result.error || "Не удалось отправить комментарий.");
        return;
      }
      setComment("");
      setSelectedSticker(null);
      setEmojiOpen(false);
      const commentsResult = await adminApi.getComments();
      if (!commentsResult.success) {
        setCommentError(commentsResult.error || "Комментарий сохранён, но список пока не удалось обновить.");
      } else {
        const records = Array.isArray(commentsResult.comments)
          ? commentsResult.comments
          : Array.isArray(commentsResult.data) ? commentsResult.data : [];
        const freshComments = records
          .filter((record): record is Record<string, unknown> => Boolean(record && typeof record === "object"))
          .filter((record) => String(record.animeId ?? (record.anime as Record<string, unknown> | undefined)?.id ?? "") === String(anime.id))
          .filter((record) => record.status !== "deleted")
          .map((record) => toCommentItem(record, anime.id));
        setComments(freshComments);
      }
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : "Ошибка соединения с сервером.");
      return;
    } finally {
      setCommentSubmitting(false);
    }
  };

  const addEmojiToComment = (emoji: string) => {
    setComment((value) => `${value}${emoji}`);
    setEmojiOpen(false);
  };

  const selectSticker = (url: string) => {
    setSelectedSticker(url);
    setEmojiOpen(false);
  };

  useEffect(() => {
    if (!publicationTimestamp || publicationTimestamp <= Date.now()) return;
    const timer = window.setInterval(() => setCountdownNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [publicationTimestamp]);

  useEffect(() => {
    setAudioTrack(audioTracks[0] || "");
  }, [currentVideo, audioTracks.length]);

  useEffect(() => {
    setIsPlaying(false);
    setVideoZoom(1);
    setVideoDuration(0);
    setVideoTime(0);
    setSubtitle("off");
  }, [currentVideo]);

  const toggleVideo = async () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      await videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  const changeVolume = (value: number) => {
    setVolume(value);
    if (videoRef.current) videoRef.current.volume = value;
  };

  const formatVideoTime = (value: number) => {
    if (!Number.isFinite(value)) return "00:00";
    return `${Math.floor(value / 60).toString().padStart(2, "0")}:${Math.floor(value % 60).toString().padStart(2, "0")}`;
  };

  const toggleVideoFullscreen = async () => {
    if (!videoStageRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await videoStageRef.current.requestFullscreen();
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    ongoing: { label: "Онгоинг ++++", color: "#22d3ee" },
    completed: { label: "Завершён", color: "#4ade80" },
    upcoming: { label: "Анонс", color: "#fbbf24" },
  };
  const st = statusMap[anime.status] ?? { label: anime.status, color: "#a0a0b8" };

  return (
    <div className="anime-detail-page min-h-screen pt-14" style={{ background: "var(--background)" }}>
      {/* Banner */}
      <div className="anime-hero relative w-full overflow-hidden" style={{ height: 340 }}>
        <img src={activeImage} alt={anime.title} className="w-full h-full object-cover transition-opacity duration-500" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,10,15,0.3) 0%, rgba(10,10,15,0.95) 100%)" }} />
        {gallery.length > 1 && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5" aria-label="Индикатор галереи">
            {gallery.map((image, index) => (
              <span key={`${image}-${index}`} className="h-1.5 rounded-full transition-all" style={{ width: index === galleryIndex ? 24 : 8, background: index === galleryIndex ? "#c084fc" : "rgba(255,255,255,0.5)" }} />
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="anime-detail-content px-6 md:px-16 -mt-32 relative z-10 pb-16">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover */}
          <div className="flex-shrink-0">
            <div className="anime-cover rounded overflow-hidden shadow-2xl" style={{ width: 200, height: 285, border: "2px solid rgba(124,58,237,0.4)", boxShadow: "0 8px 40px rgba(124,58,237,0.3)" }}>
              <img src={activeImage} alt={anime.title} className="w-full h-full object-cover transition-opacity duration-500" />
            </div>
            <button
              onClick={() => setInList(!inList)}
              className="mt-3 w-full py-2.5 rounded font-semibold transition-all text-sm"
              style={{
                background: inList ? "rgba(124,58,237,0.15)" : "linear-gradient(135deg, #7c3aed, #a855f7)",
                border: inList ? "1px solid rgba(124,58,237,0.4)" : "none",
                color: inList ? "#a855f7" : "#fff",
                fontFamily: "var(--font-display)",
                letterSpacing: "0.06em",
              }}
            >
              {inList ? "✓ В СПИСКЕ" : "+ В СПИСОК"}
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 pt-8 md:pt-16">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: "rgba(19,19,28,0.8)", border: "1px solid rgba(124,58,237,0.2)" }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: st.color }}>{st.label}</span>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>{anime.type} · {anime.year}</span>
            </div>

            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(24px,4vw,48px)", color: "#e8e8f0", letterSpacing: "0.05em", textTransform: "uppercase", lineHeight: 1.1 }}>
              {anime.title}
            </h1>
            <p className="mt-1 mb-4" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>
              {anime.titleJp} / {anime.titleEn}
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 mb-5">
              {anime.score > 0 && (
                <div>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.1em" }}>Оценка</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "#fbbf24" }}>{anime.score}</span>
                  </div>
                </div>
              )}
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.1em" }}>Серии</p>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#e8e8f0" }}>{anime.episodesAired}<span style={{ color: "#6b6b8a", fontSize: 14 }}>/{anime.episodes}</span></p>
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.1em" }}>Студия</p>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "#e8e8f0" }}>{anime.studio}</p>
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.1em" }}>Просмотры</p>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "#e8e8f0" }}>{(anime.views / 1_000_000).toFixed(1)}M</p>
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-5">
              {anime.genres.map(g => (
                <span key={g} className="px-3 py-1 rounded text-xs" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", color: "#a855f7", fontFamily: "var(--font-display)", fontWeight: 600, letterSpacing: "0.04em" }}>
                  {g}
                </span>
              ))}
            </div>

            {(scheduleLabel || publicationTimestamp) && (
              <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg px-4 py-3" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
                {scheduleLabel && <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#c4b5fd" }}>{scheduleLabel}</span>}
                {publicationTimestamp > 0 && <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: countdownMs > 0 ? "#fbbf24" : "#4ade80" }}>
                  {countdownMs > 0 ? `До публикации: ${countdownText}` : "Новая серия опубликована"}
                </span>}
              </div>
            )}

            {/* Description */}
            <div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#a0a0b8", lineHeight: 1.75, maxHeight: descExpanded ? "none" : 72, overflow: "hidden" }}>
                {anime.description}
              </p>
              <button onClick={() => setDescExpanded(!descExpanded)} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#a855f7", marginTop: 4 }}>
                {descExpanded ? "Свернуть" : "Читать полностью"}
              </button>
            </div>

            {(anime.onlineLinks?.length || anime.downloadLinks?.length || anime.originalAnimeUrl) ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {anime.onlineLinks?.map((url, index) => (
                  <a key={`online-${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="rounded px-3 py-2 text-xs" style={{ background: "rgba(124,58,237,0.18)", border: "1px solid rgba(168,85,247,0.35)", color: "#d6b5ff", fontFamily: "var(--font-mono)" }}>
                    Смотреть онлайн {index + 1}
                  </a>
                ))}
                {anime.downloadLinks?.map((url, index) => (
                  <a key={`download-${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="rounded px-3 py-2 text-xs" style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.3)", color: "#67e8f9", fontFamily: "var(--font-mono)" }}>
                    Скачать {index + 1}
                  </a>
                ))}
                {anime.originalAnimeUrl && (
                  <a href={anime.originalAnimeUrl} target="_blank" rel="noreferrer" className="rounded px-3 py-2 text-xs" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#a0a0b8", fontFamily: "var(--font-mono)" }}>
                    Оригинал
                  </a>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <section className="mt-10 overflow-hidden rounded-xl" style={{ background: "#070710", border: "1px solid rgba(124,58,237,0.2)" }}>
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5" style={{ borderColor: "rgba(124,58,237,0.15)" }}>
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: "#e8e8f0" }}>Серия {selectedEpisode}</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a" }}>Видео аниме</p>
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#a855f7" }}>{selectedEpisode} / {episodeCount}</span>
          </div>
          <div ref={videoStageRef} className="relative aspect-video bg-black" style={{ overflow: "hidden" }}>
            {currentVideo ? (
              <video
                ref={videoRef}
                key={currentVideo}
                src={currentVideo}
                className="h-full w-full object-contain transition-transform"
                style={{ transform: `scale(${videoZoom})` }}
                preload="metadata"
                onClick={toggleVideo}
                onPlay={() => {
                  setIsPlaying(true);
                  incrementAnimeViews(anime.id, selectedEpisode);
                }}
                onPause={() => setIsPlaying(false)}
                onLoadedMetadata={(event) => setVideoDuration(event.currentTarget.duration)}
                onTimeUpdate={(event) => setVideoTime(event.currentTarget.currentTime)}
                onVolumeChange={(event) => setVolume(event.currentTarget.volume)}
              >
                {subtitles.map((track) => (
                  <track key={track.src} kind="subtitles" label={track.label} srcLang={track.srclang || "ru"} src={track.src} default={subtitle === track.src} />
                ))}
              </video>
            ) : (
              <div className="flex h-full items-center justify-center px-5 text-center" style={{ color: "#6b6b8a", fontFamily: "var(--font-body)" }}>
                Видео для этой серии ещё не опубликовано
              </div>
            )}
            {currentVideo && (
              <>
                <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3 sm:p-4" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.72), transparent)" }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#e8e8f0" }}>{anime.title}</p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#c084fc" }}>Серия {selectedEpisode}</p>
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 px-3 py-3 sm:px-4" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)" }}>
                  <div className="mb-2 flex items-center gap-2">
                    <span style={{ color: "#a0a0b8", fontFamily: "var(--font-mono)", fontSize: 10 }}>{formatVideoTime(videoTime)}</span>
                    <input type="range" min="0" max={videoDuration || 0} step="0.1" value={Math.min(videoTime, videoDuration || 0)} onChange={(event) => { const value = Number(event.target.value); if (videoRef.current) videoRef.current.currentTime = value; setVideoTime(value); }} className="player-progress min-w-0 flex-1" aria-label="Прогресс видео" />
                    <span style={{ color: "#a0a0b8", fontFamily: "var(--font-mono)", fontSize: 10 }}>{formatVideoTime(videoDuration)}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button type="button" onClick={toggleVideo} className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "rgba(124,58,237,0.82)", color: "#fff" }} aria-label={isPlaying ? "Пауза" : "Воспроизвести"}>
                      {isPlaying ? "Ⅱ" : "▶"}
                    </button>
                    <span className="hidden sm:inline" style={{ color: "#a0a0b8", fontSize: 11 }}>Звук</span>
                    <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => changeVolume(Number(event.target.value))} className="w-20 accent-purple-500 sm:w-28" aria-label="Громкость" />
                    <select value={quality} onChange={(event) => setQuality(event.target.value)} className="hidden rounded px-2 py-1 text-xs sm:block" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#e8e8f0" }} aria-label="Качество видео">
                      {["Авто", "1080p", "720p", "480p"].map((item) => <option key={item} value={item} style={{ background: "#13131c" }}>{item}</option>)}
                    </select>
                    {subtitles.length > 0 && <select value={subtitle} onChange={(event) => setSubtitle(event.target.value)} className="hidden rounded px-2 py-1 text-xs sm:block" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#e8e8f0" }} aria-label="Субтитры">
                      <option value="off" style={{ background: "#13131c" }}>Субтитры выкл.</option>
                      {subtitles.map((track) => <option key={track.src} value={track.src} style={{ background: "#13131c" }}>{track.label}</option>)}
                    </select>}
                    <select value={audioTrack} onChange={(event) => setAudioTrack(event.target.value)} className="hidden rounded px-2 py-1 text-xs lg:block" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#e8e8f0" }} aria-label="Озвучка">
                      {audioTracks.map((track) => <option key={track} style={{ background: "#13131c" }}>{track}</option>)}
                    </select>
                    <button type="button" onClick={() => setVideoZoom((value) => value >= 1.25 ? 1 : value + 0.1)} className="ml-auto rounded px-2 py-1 text-xs" style={{ background: "rgba(255,255,255,0.1)", color: "#e8e8f0" }} aria-label="Изменить размер видео">{videoZoom > 1 ? `${Math.round(videoZoom * 100)}%` : "Размер"}</button>
                    <button type="button" onClick={toggleVideoFullscreen} className="rounded px-2 py-1 text-xs" style={{ background: "rgba(255,255,255,0.1)", color: "#e8e8f0" }} aria-label="Полный экран">⛶</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Tabs */}
        <div className="mt-10" style={{ borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
          <div className="flex gap-0 anime-tabs">
            {[["episodes","Серии"],["comments","Комментарии"],["related","Похожее"]].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key as typeof tab)}
                className="px-6 py-3 relative anime-tab"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: tab === key ? 700 : 400,
                  fontSize: 14,
                  color: tab === key ? "#a855f7" : "#6b6b8a",
                  borderBottom: tab === key ? "2px solid #a855f7" : "2px solid transparent",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: -1,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="mt-6">
          {tab === "episodes" && (
            <div className="flex flex-col gap-2">
              {episodes.map(ep => (
                <div
                  key={ep.num}
                  className="flex items-center gap-4 px-4 py-3 rounded cursor-pointer group transition-all anime-episode-row"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.08)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.08)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                  onClick={() => setSelectedEpisode(ep.num)}
                >
                  <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ background: "rgba(124,58,237,0.15)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#a855f7" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                  <div className="flex-1">
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, color: "#e8e8f0" }}>{ep.title}</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>{ep.duration}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>{ep.aired}</span>
                </div>
              ))}
            </div>
          )}
          {tab === "comments" && (
            <div className="flex flex-col gap-4 max-w-2xl">
              <div className="relative p-4 rounded" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.14)" }}>
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#fff" }}>{user?.username?.charAt(0).toUpperCase() || "К"}</span>
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void addComment();
                        }
                      }}
                      disabled={!canComment || commentSubmitting}
                      rows={3}
                      placeholder={canComment ? "Написать комментарий..." : "Войдите, чтобы оставить комментарий"}
                      className="w-full px-3 py-2 rounded outline-none resize-none"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.2)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 13 }}
                    />
                    {commentError && <p className="mt-2 text-xs" style={{ color: "#f87171" }}>{commentError}</p>}
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <button type="button" onClick={() => setEmojiOpen((open) => !open)} disabled={!canComment || commentSubmitting} className="rounded px-2.5 py-1.5 text-xs" style={{ background: "rgba(124,58,237,0.16)", border: "1px solid rgba(168,85,247,0.35)", color: "#f4eaff" }}>
                        😊 Смайлики
                      </button>
                      <button type="button" onClick={() => void addComment()} disabled={!user || !localStorage.getItem("animeSuAuthToken") || commentSubmitting || (!comment.trim() && !selectedSticker)} className="rounded px-3 py-1.5 text-xs font-semibold" style={{ background: user && localStorage.getItem("animeSuAuthToken") && (comment.trim() || selectedSticker) && !commentSubmitting ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "rgba(255,255,255,0.08)", color: user && localStorage.getItem("animeSuAuthToken") && (comment.trim() || selectedSticker) && !commentSubmitting ? "#fff" : "#6b6b8a" }}>
                        {commentSubmitting ? "ОТПРАВКА..." : "ОТПРАВИТЬ +"}
                      </button>
                    </div>
                    {selectedSticker && <div className="mt-2 flex items-center gap-2 rounded p-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <img src={selectedSticker} alt="Выбранный стикер" className="h-12 w-12 object-contain" />
                      <button type="button" onClick={() => setSelectedSticker(null)} className="text-xs" style={{ color: "#a0a0b8" }}>Удалить стикер</button>
                    </div>}
                    {!user && <p className="mt-2" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a" }}>Авторизуйтесь в личном кабинете.</p>}
                  </div>
                </div>
                {emojiOpen && (
                  <div className="emoji-menu-panel absolute left-0 top-full z-20 mt-2 w-[min(390px,94vw)] max-h-[min(430px,70vh)] overflow-y-auto rounded-xl p-3 shadow-2xl">

                    <div className="emoji-quick-row emoji-category-row mt-3" aria-label="Категория эмодзи">
                      {([
                        ["smileys", "😊", "Смайлики"],
                        ["symbols", "✦", "Символы"],
                        ["stickers", stickerCategoryIcon, `Стикеры ${stickers.length}`],
                      ] as const).map(([category, icon, label]) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setEmojiCategory(category)}
                          className={`emoji-quick-item emoji-category-item ${emojiCategory === category ? "active" : ""}`}
                          title={label}
                          aria-label={label}
                          aria-pressed={emojiCategory === category}
                        >
                          {category === "stickers" ? (
                            <img src={icon} alt={label} className="h-7 w-7 object-contain" />
                          ) : (
                            <span>{icon}</span>
                          )}
                        </button>
                      ))}
                    </div>
                    {emojiCategory === "smileys" && <div className="mt-3 grid grid-cols-8 gap-1 justify-center justify-items-center place-items-center">
                      {SmileysAndEmotions.filter((emoji) => /\p{Extended_Pictographic}/u.test(emoji)).map((emoji, index) => (
                        <button key={`${emoji}-${index}`} type="button" onClick={() => addEmojiToComment(emoji)} className="emoji-picker-item" title={emoji}>
                          <span>{emoji}</span>
                        </button>
                      ))}
                    </div>}
                    {emojiCategory === "symbols" && <div className="mt-3 grid grid-cols-2 gap-1.5 justify-center justify-items-center place-items-center">
                      {decorativeSymbols.map((symbol, index) => (
                        <button key={`${symbol}-${index}`} type="button" onClick={() => addEmojiToComment(symbol)} className="emoji-symbol-item">{symbol}</button>
                      ))}
                    </div>}
                    {emojiCategory === "stickers" && <div className="mt-3 grid grid-cols-4 gap-2 justify-center justify-items-center place-items-center">
                      {stickers.map((sticker) => (
                        <button key={sticker.url} type="button" onClick={() => selectSticker(sticker.url)} className="emoji-sticker-item" title={sticker.name}>
                          <img src={sticker.url} alt={sticker.name} />
                        </button>
                      ))}
                    </div>}
                    {!stickers.length && emojiCategory === "stickers" && <p className="mt-3 text-xs" style={{ color: "#6b6b8a" }}>Стикеры пока не добавлены.</p>}
                  </div>
                )}
              </div>
              {comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#fff" }}>{c.avatar}</span>
                  </div>
                  <div className="flex-1 p-3 rounded" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.1)" }}>
                    <div className="flex items-center gap-3 mb-1.5">
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, color: "#e8e8f0" }}>{c.user}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a" }}>{c.date}</span>
                    </div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#a0a0b8", lineHeight: 1.6 }}>{c.text}</p>
                    {c.sticker && <img src={c.sticker} alt="Стикер в комментарии" className="mt-2 h-20 w-20 object-contain" />}
                    <div className="flex items-center gap-1 mt-2">
                      <button style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>♥ {c.likes}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === "related" && (
            <div className="flex gap-4 flex-wrap">
              {related.map(a => (
                <div key={a.id} className="anime-card cursor-pointer" style={{ width: 176 }} onClick={() => onNavigate("anime", a)}>
                  <div className="relative rounded overflow-hidden" style={{ height: 250, border: "1px solid rgba(124,58,237,0.15)" }}>
                    <img src={a.cover} alt={a.title} className="anime-card-img w-full h-full object-cover transition-transform duration-400" />
                    <div className="anime-card-overlay absolute inset-0 opacity-0 transition-opacity duration-300 flex items-end p-3" style={{ background: "linear-gradient(to top, rgba(10,10,15,0.9) 0%, transparent 70%)" }}>
                      <button className="w-full py-1.5 rounded text-xs font-semibold" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", fontFamily: "var(--font-display)", letterSpacing: "0.06em" }}>СМОТРЕТЬ</button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-semibold line-clamp-2" style={{ fontFamily: "var(--font-display)", color: "#e8e8f0", fontSize: 13 }}>{a.title}</p>
                  {a.score > 0 && <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#fbbf24" }}>★ {a.score}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
