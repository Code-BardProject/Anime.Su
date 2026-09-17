import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import CatalogPage from "./components/CatalogPage";
import AnimePage from "./pages/AnimePage";
import PlayerPage from "./components/PlayerPage";
import ProfilePage from "./app/user/ProfilePage";
import SchedulePage from "./components/SchedulePage";
import NewsPage from "./components/NewsPage";
import AdminPage from "./app/admin/AdminPage";
import AdminLayout from "./app/admin/layout";
import AdminEmailVerification from "./app/admin/AdminEmailVerification";
import AuthPage from "./app/auth/AuthPage";
import AuthCallback from "./app/auth/callback";
import { animeList, getStoredAnime, mergeAnimeList } from "./data/mockData";
import { database } from "../services/database";

type Page = "home" | "catalog" | "anime" | "player" | "profile" | "schedule" | "news" | "admin" | "admin-layout" | "admin-email-verification" | "login" | "register" | "callback";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [selectedAnime, setSelectedAnime] = useState(() => animeList[0]);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [selectedEpisode, setSelectedEpisode] = useState(1);

  useEffect(() => {
    let isMounted = true;

    const storedAnime = getStoredAnime();
    if (storedAnime.length) {
      mergeAnimeList(storedAnime);
    }

    const syncCatalog = async () => {
      try {
        console.log('Syncing anime catalog from database...');
        const result = await database.loadAnimeFromDatabase();
        
        if (isMounted && result.success && result.data) {
          console.log('Successfully loaded anime from database:', result.data.length, 'items');
          const storedItems = getStoredAnime();
          const itemsById = new Map<string, any>();
          [...storedItems, ...result.data].forEach((item: any) => {
            const id = String(item._id || item.id || item.slug || item.title);
            const previous = itemsById.get(id);
            itemsById.set(id, {
              ...previous,
              ...item,
              createdByAdmin: Boolean(item.createdByAdmin || previous?.createdByAdmin),
            });
          });
          mergeAnimeList(Array.from(itemsById.values()));
          setSelectedAnime((current) => result.data?.find((item) => String(item.id || item._id) === String(current.id)) || result.data?.[0] || current);
        } else {
          console.warn('Failed to load anime from database:', result.error || 'Backend returned an unsuccessful response');
        }
      } catch (error) {
        console.warn("Public anime sync failed:", error);
      }
    };

    syncCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle OAuth callback routes
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/auth/discord/callback') || path.includes('/auth/vk/callback')) {
      setPage('callback');
    }
  }, []);

  // Handle secret key combination for admin access (Ctrl+Alt+F1)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === 'F1') {
        e.preventDefault();
        setPage('admin-layout');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigate = (target: string, data?: unknown) => {
    if (target === "login" || target === "register") {
      setAuthMode(target);
    }
    if (target === "anime" && data) {
      const nextAnime = data as typeof animeList[0];
      setSelectedAnime(nextAnime);
    }
    if (target === "player" && data) {
      const playerData = data as { anime?: typeof animeList[0]; episode?: number };
      if (playerData.anime) {
        setSelectedAnime(playerData.anime);
      }
      setSelectedEpisode(Math.max(1, Number(playerData.episode) || 1));
    }

    setPage(target as Page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showNav = page !== "admin" && page !== "admin-layout" && page !== "admin-email-verification" && page !== "login" && page !== "register" && page !== "callback";

  return (
    <div className="min-h-full" style={{ background: "var(--background)" }}>
      {showNav && <Navbar currentPage={page} onNavigate={navigate} />}
      {page === "home" && <HomePage onNavigate={navigate} />}
      {page === "catalog" && <CatalogPage onNavigate={navigate} />}
      {page === "anime" && <AnimePage anime={selectedAnime} onNavigate={navigate} />}
      {page === "player" && <PlayerPage anime={selectedAnime} episode={selectedEpisode} onNavigate={navigate} />}
      {page === "profile" && <ProfilePage onNavigate={navigate} />}
      {page.startsWith("profile/") && <ProfilePage subPage={page.split("/")[1]} onNavigate={navigate} />}
      {page === "schedule" && <SchedulePage onNavigate={navigate} />}
      {page === "news" && <NewsPage />}
      {page === "admin" && <AdminPage onNavigate={navigate} />}
      {page === "admin-layout" && <AdminLayout onNavigate={navigate} />}
      {page === "admin-email-verification" && <AdminEmailVerification onSuccess={() => navigate("admin")} />}
      {(page === "login" || page === "register") && (
        <AuthPage mode={authMode} onSuccess={() => navigate("profile")} onSwitch={setAuthMode} onBack={() => navigate("home")} />
      )}
      {page === "callback" && <AuthCallback />}
    </div>
  );
}
