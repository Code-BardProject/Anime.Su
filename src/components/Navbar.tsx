import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LanguageSelector, useLanguage } from "../i18n/in8n";

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const links = [
  { id: "home", labelKey: "nav.home" },
  { id: "catalog", labelKey: "nav.catalog" },
  { id: "schedule", labelKey: "nav.schedule" },
  { id: "news", labelKey: "nav.news" },
];

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const go = (page: string) => {
    onNavigate(page);
    setMenuOpen(false);
    setProfileOpen(false);
  };

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 md:px-8"
        style={{ background: "rgba(10,10,15,0.95)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(124,58,237,0.15)" }}
      >
        {/* Logo */}
        <button onClick={() => go("home")} className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#fff" }}>A</span>
          </div>
          <span className="hidden sm:block" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, color: "#e8e8f0", letterSpacing: "0.08em" }}>
            Anime.<span style={{ color: "#a855f7" }}>Su</span>
          </span>
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(l => {
            const keys = l.labelKey.split('.');
            const label = keys.reduce((obj, key) => obj?.[key], t) || l.labelKey;
            return (
              <button
                key={l.id}
                onClick={() => go(l.id)}
                className="nav-link px-4 py-1.5 rounded transition-colors"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: currentPage === l.id ? 700 : 500,
                  fontSize: 14,
                  letterSpacing: "0.05em",
                  color: currentPage === l.id ? "#a855f7" : "#a0a0b8",
                  background: currentPage === l.id ? "rgba(124,58,237,0.1)" : "transparent",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Right zone */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="hidden sm:block">
            <LanguageSelector />
          </div>
          
          {/* Search */}
          <button
            onClick={() => go("catalog")}
            className="p-2 rounded transition-all hidden sm:flex"
            style={{ color: "#6b6b8a" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#a855f7")}
            onMouseLeave={e => (e.currentTarget.style.color = "#6b6b8a")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded transition-all"
                style={{ background: profileOpen ? "rgba(124,58,237,0.15)" : "transparent", border: "1px solid transparent" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)")}
                onMouseLeave={e => { if (!profileOpen) e.currentTarget.style.borderColor = "transparent"; }}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "#fff" }}>{user.avatar}</span>
                </div>
                <span className="hidden sm:block max-w-24 truncate" style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "#e8e8f0" }}>{user.username}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b6b8a" strokeWidth="2" style={{ transform: profileOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><path d="m6 9 6 6 6-6"/></svg>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-lg overflow-hidden z-50" style={{ background: "rgba(19,19,28,0.98)", border: "1px solid rgba(124,58,237,0.25)", boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }}>
                  <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(124,58,237,0.12)" }}>
                    <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#e8e8f0" }}>{user.username}</p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a" }}>{user.email}</p>
                    {user.isPremium && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", fontFamily: "var(--font-mono)", fontSize: 9, color: "#fff" }}>PREMIUM</span>
                    )}
                  </div>
                  {[
                    { id: "profile", icon: "👤", label: t.profile.menu.profile },
                    { id: "profile/watchlist", icon: "📋", label: t.profile.menu.watchlist },
                    { id: "profile/history", icon: "🕐", label: t.profile.menu.history },
                    { id: "profile/notifications", icon: "🔔", label: t.profile.menu.notifications },
                    { id: "profile/settings", icon: "⚙️", label: t.profile.menu.settings },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => go(item.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                      style={{ color: "#a0a0b8", fontFamily: "var(--font-body)", fontSize: 13 }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#e8e8f0"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#a0a0b8"; }}
                    >
                      <span style={{ fontSize: 14 }}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                  {user.role === "ADMIN" && (
                    <button
                      onClick={() => go("admin")}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                      style={{ color: "#a855f7", fontFamily: "var(--font-body)", fontSize: 13 }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.08)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <span>🛡️</span> {t.profile.menu.admin}
                    </button>
                  )}
                  <div style={{ borderTop: "1px solid rgba(124,58,237,0.12)" }}>
                    <button
                      onClick={() => { logout(); setProfileOpen(false); go("home"); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                      style={{ color: "#f87171", fontFamily: "var(--font-body)", fontSize: 13 }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.06)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <span>↩</span> {t.profile.menu.logout}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => go("login")}
                className="px-3 py-1.5 rounded text-sm transition-all hidden sm:block"
                style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "#a0a0b8", border: "1px solid rgba(255,255,255,0.1)", letterSpacing: "0.04em" }}
              >
                {t.auth.login}
              </button>
              <button
                onClick={() => go("register")}
                className="px-3 py-1.5 rounded text-sm transition-all"
                style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "#fff", background: "linear-gradient(135deg,#7c3aed,#a855f7)", letterSpacing: "0.04em" }}
              >
                {t.auth.register}
              </button>
            </div>
          )}

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded ml-1"
            style={{ color: "#a0a0b8", background: menuOpen ? "rgba(124,58,237,0.15)" : "transparent" }}
          >
            {menuOpen
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            }
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(10,10,15,0.98)", top: 56 }}
        >
          <div className="flex flex-col p-6 gap-1">
            {links.map(l => {
              const keys = l.labelKey.split('.');
              const label = keys.reduce((obj, key) => obj?.[key], t) || l.labelKey;
              return (
                <button
                  key={l.id}
                  onClick={() => go(l.id)}
                  className="w-full text-left py-3.5 px-4 rounded transition-all"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 18,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: currentPage === l.id ? "#a855f7" : "#e8e8f0",
                    background: currentPage === l.id ? "rgba(124,58,237,0.1)" : "transparent",
                  }}
                >
                  {label}
                </button>
              );
            })}
            <div className="mt-4 h-px" style={{ background: "rgba(124,58,237,0.15)" }} />
            
            {/* Language selector for mobile */}
            <div className="py-3 px-4">
              <LanguageSelector />
            </div>
            
            {user ? (
              <>
                <button onClick={() => go("profile")} className="w-full text-left py-3 px-4" style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "#a0a0b8" }}>Профиль</button>
                <button onClick={() => go("profile/watchlist")} className="w-full text-left py-3 px-4" style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "#a0a0b8" }}>Списки</button>
                <button onClick={() => go("profile/settings")} className="w-full text-left py-3 px-4" style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "#a0a0b8" }}>Настройки</button>
                {user.role === "ADMIN" && (
                  <button onClick={() => go("admin")} className="w-full text-left py-3 px-4" style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "#a855f7" }}>Админ-панель</button>
                )}
                <button onClick={() => { logout(); go("home"); }} className="w-full text-left py-3 px-4" style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "#f87171" }}>Выйти</button>
              </>
            ) : (
              <div className="flex flex-col gap-3 mt-2">
                <button onClick={() => go("login")} className="w-full py-3.5 rounded" style={{ border: "1px solid rgba(124,58,237,0.3)", color: "#a855f7", fontFamily: "var(--font-display)", fontSize: 15, letterSpacing: "0.08em" }}>{t.auth.login.toUpperCase()}</button>
                <button onClick={() => go("register")} className="w-full py-3.5 rounded" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", fontFamily: "var(--font-display)", fontSize: 15, letterSpacing: "0.08em" }}>{t.auth.register.toUpperCase()}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Close dropdown on outside click */}
      {profileOpen && <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />}
    </>
  );
}
