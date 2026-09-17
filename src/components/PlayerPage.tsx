import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { animeList, incrementAnimeViews } from "../data/mockData";
import { SmileysAndEmotions } from "../emoji/Emoji";
import { EmojiAnimation } from "../emoji/EmojiAnimation";
import { adminApi } from "../../services/adminApi";

interface PlayerPageProps {
  anime: typeof animeList[0] & {
    deviceVideos?: string[];
    remoteVideos?: string[];
    videoUrl?: string;
    subtitles?: Array<{ label: string; src: string; srclang?: string }>;
    audioTracks?: Array<{ label: string; src?: string }>;
    episodesList?: Array<{ number: number; title?: string; videoUrl: string }>;
  };
  episode?: number;
  onNavigate: (page: string, data?: unknown) => void;
}

const defaultVoicings = ["Оригинал", "Русская озвучка", "Субтитры"];
const qualities = ["Авто", "1080p", "720p", "480p"];

type EpisodeComment = {
  id: string | number;
  user: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
  sticker?: string;
};

const mockEpisodeComments: EpisodeComment[] = [
  { id: 1, user: "WatchDog_v3", avatar: "W", text: "Эта сцена просто взорвала мне мозг 🤯", time: "5 мин назад", likes: 24 },
  { id: 2, user: "AnimeLover_RU", avatar: "A", text: "Лучшая серия сезона, без вопросов!", time: "12 мин назад", likes: 18 },
  { id: 3, user: "OtakuPrime", avatar: "O", text: "Ждём следующую серию с нетерпением", time: "1 ч назад", likes: 9 },
];

export default function PlayerPage({ anime, episode = 1, onNavigate }: PlayerPageProps) {
  const { user } = useAuth();
  const [currentEp, setCurrentEp] = useState(episode);
  const [voicing, setVoicing] = useState(defaultVoicings[0]);
  const [quality, setQuality] = useState(qualities[0]);
  const [subtitle, setSubtitle] = useState("off");
  const [sidePanel, setSidePanel] = useState<"episodes" | "comments">("episodes");
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<EpisodeComment[]>(mockEpisodeComments);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(1);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);

  const cycleZoom = () => {
    setZoom((currentZoom) => currentZoom >= 1.2 ? 1 : Number(Math.min(currentZoom + 0.1, 1.2).toFixed(2)));
  };

  const episodeEntries = (anime.episodesList || []).slice().sort((first, second) => first.number - second.number);
  const videoSources = [
    ...(anime.deviceVideos || []),
    ...(anime.remoteVideos || []),
  ];
  const episodeCount = Math.max(1, Math.min(
    anime.episodes || 1,
    Math.max(anime.episodesAired || 1, episodeEntries.length, videoSources.length || (anime.videoUrl ? 1 : 0)),
  ));
  const episodes = Array.from({ length: episodeCount }, (_, i) => i + 1);
  const hasNext = currentEp < episodeCount;
  const hasPrev = currentEp > 1;
  const currentVideo = episodeEntries.find((item) => item.number === currentEp)?.videoUrl || videoSources[currentEp - 1] || (currentEp === 1 ? anime.videoUrl : "");
  const subtitles = anime.subtitles || [];
  const voicings = anime.audioTracks?.length ? anime.audioTracks.map((track) => track.label) : defaultVoicings;
  const progressKey = `animeSuProgress:${String(anime.id)}:${currentEp}`;

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setSubtitle("off");
  }, [currentVideo]);

  useEffect(() => {
    let active = true;
    const loadComments = async () => {
      const result = await adminApi.getComments();
      if (!active || !result.success) return;

      const records = Array.isArray(result.comments)
        ? result.comments
        : Array.isArray(result.data) ? result.data : [];
      const episodeComments = records
        .filter((record): record is Record<string, unknown> => Boolean(record && typeof record === "object"))
        .filter((record) => String(record.animeId ?? (record.anime as Record<string, unknown> | undefined)?.id ?? "") === String(anime.id))
        .filter((record) => Number(record.episode ?? 1) === currentEp)
        .filter((record) => record.status !== "deleted")
        .map((record): EpisodeComment => {
          const author = record.userId && typeof record.userId === "object"
            ? record.userId as Record<string, unknown>
            : undefined;
          const userName = String(record.userName ?? author?.username ?? record.email ?? "Пользователь");
          return {
            id: String(record.id ?? record._id ?? Date.now()),
            user: userName,
            avatar: String(record.avatar ?? author?.avatar ?? (userName.charAt(0).toUpperCase() || "U")),
            text: String(record.text ?? record.content ?? ""),
            time: record.createdAt ? new Date(String(record.createdAt)).toLocaleDateString("ru-RU") : "",
            likes: Number(record.likes ?? 0),
            sticker: typeof record.sticker === "string" ? record.sticker : undefined,
          };
        });
      setComments(episodeComments);
    };

    void loadComments();
    return () => { active = false; };
  }, [anime.id, currentEp]);

  const togglePlay = async () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      await videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  const seek = (value: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const saveProgress = (value: number) => {
    setCurrentTime(value);
    if (value > 0 && duration > 0 && value < duration - 5) {
      localStorage.setItem(progressKey, String(value));
    }
  };

  const toggleFullscreen = async () => {
    if (!playerRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await playerRef.current.requestFullscreen();
    }
  };

  const formatTime = (value: number) => {
    if (!Number.isFinite(value)) return "00:00";
    return `${Math.floor(value / 60).toString().padStart(2, "0")}:${Math.floor(value % 60).toString().padStart(2, "0")}`;
  };

  const addComment = async () => {
    const text = comment.trim();
    if (!user || !text) return;

    const payload = {
      animeId: anime.id,
      animeTitle: anime.title,
      episode: currentEp,
      userId: user.id,
      userName: user.username || user.email,
      email: user.email,
      text,
      content: text,
      avatar: typeof user.avatar === "string" && user.avatar.startsWith("http") ? user.avatar : undefined,
    };

    try {
      const result = await adminApi.createComment(payload);
      if (!result.success) return;
    } catch {
      // keep the UI local-only fallback path if the admin route is unavailable
    }

    const avatar = typeof user.avatar === "string" && user.avatar.startsWith("http")
      ? user.avatar
      : user.avatar || user.username?.charAt(0)?.toUpperCase() || "U";

    const nextComment = {
      id: Date.now(),
      user: user.username || user.email || "Вы",
      avatar: avatar.startsWith("http") ? "" : avatar.charAt(0).toUpperCase(),
      text,
      time: "только что",
      likes: 0,
    };

    setComments((items) => [nextComment, ...items]);
    setComment("");
  };

  const addEmojiToComment = (emoji: string) => {
    setComment((value) => `${value}${emoji}`);
    setEmojiOpen(false);
  };

  const animatedEmojiPreview = EmojiAnimation.slice(0, 90);

  return (
    <div className="player-page min-h-screen pt-14 flex flex-col" style={{ background: "#070710" }}>
      {/* Breadcrumb */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center gap-2 flex-wrap" style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
        <button onClick={() => onNavigate("home")} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>Главная</button>
        <span style={{ color: "#3d3d58" }}>/</span>
        <button onClick={() => onNavigate("anime", anime)} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>{anime.title}</button>
        <span style={{ color: "#3d3d58" }}>/</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#a855f7" }}>Серия {currentEp}</span>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 player-layout">
        {/* Player area */}
        <div className="flex-1 flex flex-col">
          {/* Video */}
          <div ref={playerRef} className="relative bg-black player-stage" style={{ aspectRatio: "16/9", maxHeight: "calc(100vh - 120px)" }}>
            {currentVideo ? (
              <video
                ref={videoRef}
                key={currentVideo}
                src={currentVideo}
                className="w-full h-full object-contain bg-black transition-transform"
                style={{ transform: `scale(${zoom})` }}
                onClick={togglePlay}
                onPlay={() => {
                  setIsPlaying(true);
                  incrementAnimeViews(anime.id, currentEp);
                }}
                onPause={() => setIsPlaying(false)}
                onLoadedMetadata={(event) => {
                  setDuration(event.currentTarget.duration);
                  const savedTime = Number(localStorage.getItem(progressKey) || 0);
                  if (savedTime > 0 && savedTime < event.currentTarget.duration - 5) {
                    event.currentTarget.currentTime = savedTime;
                    setCurrentTime(savedTime);
                  }
                }}
                onTimeUpdate={(event) => saveProgress(event.currentTarget.currentTime)}
                onEnded={() => {
                  localStorage.removeItem(progressKey);
                  if (hasNext) setCurrentEp((value) => value + 1);
                }}
              >
                {subtitles.map((track) => (
                  <track key={track.src} kind="subtitles" label={track.label} srcLang={track.srclang || "ru"} src={track.src} default={subtitle === track.src} />
                ))}
              </video>
            ) : (
              <img src={anime.banner} alt={anime.title} className="w-full h-full object-cover opacity-40" />
            )}

            <div className="absolute left-4 top-20 flex items-center gap-2 rounded-full px-3 py-1 text-[11px]" style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(168,85,247,0.4)", color: "#f4eaff", fontFamily: "var(--font-mono)" }}>
              <span aria-label="Kачество видео" className="inline-block h-2 w-2 rounded-full" style={{ background: "#8b5cf6", boxShadow: "0 0 12px rgba(139,92,246,0.9)" }}></span>
              <span>{quality}</span>
            </div>

            {/* Play overlay */}
            {!currentVideo && <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all"
                style={{ background: isPlaying ? "rgba(168,85,247,0.2)" : "rgba(124,58,237,0.9)", backdropFilter: "blur(8px)", boxShadow: "0 0 32px rgba(124,58,237,0.6)" }}
              >
                {isPlaying
                  ? <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  : <svg width="24" height="24" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 4 }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                }
              </button>
            </div>}
            {!currentVideo && <div className="absolute inset-x-0 bottom-16 text-center text-sm px-4" style={{ color: "#a0a0b8" }}>Видео для этой серии пока не опубликовано</div>}

            {/* Title overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)" }}>
              <div>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#e8e8f0", letterSpacing: "0.04em" }}>{anime.title}</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#a855f7" }}>Серия {currentEp} · {voicing}</p>
              </div>
              <button onClick={() => onNavigate("anime", anime)} className="p-1.5 rounded" style={{ background: "rgba(0,0,0,0.5)", color: "#a0a0b8" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Progress bar mock */}
            <div className="absolute bottom-0 left-0 right-0 px-3 sm:px-4 pb-3" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)" }}>
              <div className="flex items-center gap-3 mb-2">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#a0a0b8" }}>{formatTime(currentTime)}</span>
                <input type="range" min={0} max={duration || 0} step={0.1} value={Math.min(currentTime, duration || 0)} onChange={(event) => seek(Number(event.target.value))} className="player-progress flex-1" aria-label="Прогресс видео" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#a0a0b8" }}>{formatTime(duration)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button className="text-white opacity-60 hover:opacity-100" onClick={() => hasPrev && setCurrentEp(e => e - 1)} style={{ opacity: hasPrev ? 0.8 : 0.3 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
                  </button>
                  <button className="text-white" onClick={togglePlay} disabled={!currentVideo} aria-label={isPlaying ? "Пауза" : "Продолжить"}>
                    {isPlaying ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}><polygon points="5 3 19 12 5 21 5 3"/></svg>}
                  </button>
                  <button className="text-white opacity-60 hover:opacity-100" onClick={() => hasNext && setCurrentEp(e => e + 1)} style={{ opacity: hasNext ? 0.8 : 0.3 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-white opacity-70 hover:opacity-100" onClick={cycleZoom} aria-label="Изменить масштаб видео">↗</button>
                  <select value={quality} onChange={e => setQuality(e.target.value)} className="text-xs rounded px-2 py-0.5 outline-none" style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.2)", color: "#e8e8f0", fontFamily: "var(--font-mono)", fontSize: 10 }} aria-label="Качество видео">
                    {qualities.map(q => <option key={q} value={q} style={{ background: "#13131c" }}>{q}</option>)}
                  </select>
                  <button className="text-white opacity-70 hover:opacity-100" onClick={toggleFullscreen} aria-label="Полный экран">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Voicing + nav bar below player */}
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-3" style={{ background: "rgba(13,13,20,0.95)", borderBottom: "1px solid rgba(124,58,237,0.12)" }}>
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.1em" }}>Озвучка:</span>
              {voicings.map(v => (
                <button key={v} onClick={() => setVoicing(v)} className="px-3 py-1 rounded text-xs transition-all" style={{ background: voicing === v ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${voicing === v ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.06)"}`, color: voicing === v ? "#a855f7" : "#6b6b8a", fontFamily: "var(--font-mono)", fontSize: 10 }}>
                  {v}
                </button>
              ))}
              {subtitles.length > 0 && <select value={subtitle} onChange={(event) => setSubtitle(event.target.value)} className="rounded px-2 py-1 text-xs" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#a0a0b8" }} aria-label="Субтитры">
                <option value="off">Субтитры выкл.</option>
                {subtitles.map((track) => <option key={track.src} value={track.src}>{track.label}</option>)}
              </select>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => hasPrev && setCurrentEp(e => e - 1)} disabled={!hasPrev} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-all" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: hasPrev ? "#a0a0b8" : "#3d3d58", fontFamily: "var(--font-display)", fontSize: 12, letterSpacing: "0.04em" }}>
                ← Пред.
              </button>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#a855f7" }}>Эп. {currentEp}</span>
              <button onClick={() => hasNext && setCurrentEp(e => e + 1)} disabled={!hasNext} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-all" style={{ background: hasNext ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${hasNext ? "rgba(124,58,237,0.35)" : "rgba(255,255,255,0.06)"}`, color: hasNext ? "#a855f7" : "#3d3d58", fontFamily: "var(--font-display)", fontSize: 12, letterSpacing: "0.04em" }}>
                След. →
              </button>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="lg:w-80 flex-shrink-0 flex flex-col" style={{ borderLeft: "1px solid rgba(124,58,237,0.12)", maxHeight: "calc(100vh - 56px)" }}>
          {/* Panel tabs */}
          <div className="flex" style={{ borderBottom: "1px solid rgba(124,58,237,0.12)" }}>
            {(["episodes","comments"] as const).map(p => (
              <button key={p} onClick={() => setSidePanel(p)} className="flex-1 py-3 text-sm transition-all" style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: sidePanel === p ? 700 : 400, letterSpacing: "0.06em", textTransform: "uppercase", color: sidePanel === p ? "#a855f7" : "#6b6b8a", borderBottom: sidePanel === p ? "2px solid #a855f7" : "2px solid transparent", marginBottom: -1, background: "transparent" }}>
                {p === "episodes" ? "Серии" : "Комментарии"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {sidePanel === "episodes" && (
              <div className="space-y-1">
                {episodes.map(ep => (
                  <button key={ep} onClick={() => setCurrentEp(ep)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-left transition-all" style={{ background: ep === currentEp ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.02)", border: `1px solid ${ep === currentEp ? "rgba(124,58,237,0.35)" : "transparent"}` }}>
                    <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ background: ep === currentEp ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "rgba(255,255,255,0.06)" }}>
                      {ep === currentEp
                        ? <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        : <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a" }}>{ep}</span>
                      }
                    </div>
                    <div>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: 12, color: ep === currentEp ? "#a855f7" : "#a0a0b8", fontWeight: ep === currentEp ? 700 : 400 }}>Серия {ep}</p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#6b6b8a" }}>24 мин</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {sidePanel === "comments" && (
              <div className="comments-panel">
                <div className="flex gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, color: "#fff" }}>{user?.username?.charAt(0)?.toUpperCase() || "К"}</span>
                  </div>
                  <div className="flex-1">
                    <div className="relative">
                      <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        disabled={!user}
                        rows={4}
                        placeholder={user ? "Написать комментарий..." : "Авторизуйтесь, чтобы комментировать"}
                        className="w-full px-3 py-2 rounded text-sm outline-none resize-none"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.2)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 12, opacity: user ? 1 : 0.8 }}
                      />

                      <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEmojiOpen(!emojiOpen)}
                            disabled={!user}
                            className="rounded px-2 py-1 text-xs transition-all"
                            style={{ background: "rgba(124,58,237,0.16)", border: "1px solid rgba(168,85,247,0.45)", color: "#f4eaff", fontFamily: "var(--font-display)" }}
                          >
                            😊 Смайлики
                          </button>
                          {user && comment.trim() && (
                            <button onClick={addComment} className="px-3 py-1 rounded text-xs" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", fontFamily: "var(--font-display)", letterSpacing: "0.06em" }}>
                              ОТПРАВИТЬ 
                            </button>
                          )}
                        </div>
                      </div>

                      {emojiOpen && (
                        <div className="absolute left-0 top-full z-20 mt-2 w-[min(330px,76vw)] max-h-52 overflow-y-auto rounded-xl p-2 shadow-2xl" style={{ background: "#141428", border: "1px solid rgba(168,85,247,0.45)", boxShadow: "0 20px 60px rgba(124,58,237,0.45)" }}>
                          <div className="flex items-center justify-between px-1 mb-2">
                            <span style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#a855f7", fontWeight: 700 }}>Smileys and emotions</span>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a" }}>{animatedEmojiPreview.length}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            {SmileysAndEmotions.slice(0, 94).map((emoji) => (
                              <button key={emoji} onClick={() => addEmojiToComment(emoji)} className="w-8 h-8 rounded flex items-center justify-center transition-all hover:scale-110" style={{ background: "rgba(255,255,255,0.04)", color: "#fff", border: "1px solid rgba(124,58,237,0.12)" }} title={emoji}>
                                <span style={{ fontSize: 18 }}>{emoji}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {!user && (
                      <div className="mt-1.5 text-xs" style={{ fontFamily: "var(--font-mono)", color: "#6b6b8a" }}>Пользователь должен войти в личный кабинет.</div>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, color: "#fff" }}>{c.avatar}</span>
                      </div>
                      <div className="flex-1 p-2.5 rounded" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.08)" }}>
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 11, color: "#e8e8f0" }}>{c.user}</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#6b6b8a" }}>{c.time}</span>
                        </div>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#a0a0b8", lineHeight: 1.5 }}>{c.text}</p>
                        {c.sticker && <img src={c.sticker} alt="Стикер в комментарии" className="mt-2 h-16 w-16 object-contain" />}
                        <button style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", marginTop: 4 }}>♥ {c.likes}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
