import { useState } from "react";
import { loginUser } from "../../../services/userApi";
import { useAuth, type User } from "../../context/AuthContext";
import GoogleAuth from "./googleAuth";
import DiscordAuth from "./discord";
import VKAuth from "./vk";

interface LoginProps {
  onSuccess: () => void;
  onBack: () => void;
  onSwitchTo: (mode: "register" | "forgot" | "verify") => void;
}

function LoginInputField({ label, type, name, value, onChange, placeholder, error: fieldError }: {
  label: string;
  type: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label style={{ fontFamily: "var(--font-display)", fontSize: 12, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required className="w-full px-4 py-3 rounded outline-none transition-all" style={{ background: "rgba(255,255,255,0.04)", border: fieldError ? "1px solid rgba(248,113,113,0.5)" : "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }} />
      {fieldError && <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "#f87171" }}>{fieldError}</span>}
    </div>
  );
}

export default function Login({ onSuccess, onBack, onSwitchTo }: LoginProps) {
  const { setUser } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const passwordLength = form.password.length;
  const passwordColor = passwordLength < 6 ? "#f87171" : passwordLength < 8 ? "#fb923c" : "#4ade80";
  const passwordLabel = passwordLength < 6 ? "Слабый пароль" : passwordLength < 8 ? "Средний пароль" : "Надёжный пароль";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Заполните все поля");
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser({ email: form.email, password: form.password });

      if (result.success) {
        const responseData = result.data as { user?: Record<string, unknown> } | undefined;
        const serverUser = responseData?.user;
        if (serverUser) {
          const nextUser: User = {
            id: Number(serverUser.id ?? Date.now()),
            username: String(serverUser.username || form.email.split("@")[0]),
            email: String(serverUser.email || form.email),
            avatar: String(serverUser.avatar || serverUser.username || form.email[0] || "U").charAt(0).toUpperCase(),
            role: "USER",
            joinDate: new Date().toLocaleDateString("ru"),
            isPremium: false,
            emailVerified: Boolean(serverUser.isVerified ?? serverUser.emailVerified ?? true),
            stats: { watching: 0, completed: 0, planned: 0, dropped: 0 },
          };
          setUser(nextUser);
        }

        // Store token if provided
        if (result.token) {
          localStorage.setItem("animeSuAuthToken", result.token);
        }

        if (rememberMe) {
          localStorage.setItem("rememberEmail", form.email);
        }
        onSuccess();
      } else {
        setError(typeof result.error === "string" ? result.error : "Ошибка входа");
      }
    } catch (err) {
      setError("Ошибка сервера");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 pt-14"
      style={{ background: "var(--background)" }}
    >
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(124,58,237,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-md relative z-10">
        <button type="button" onClick={onBack} className="mb-4" style={{ background: "transparent", border: 0, color: "#a855f7", fontFamily: "var(--font-body)", cursor: "pointer" }}>← На главную</button>
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#fff",
                }}
              >
                A
              </span>
            </div>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 26,
                color: "#e8e8f0",
                letterSpacing: "0.08em",
              }}
            >
              Anime.<span style={{ color: "#a855f7" }}>Su</span>
            </span>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-8"
          style={{
            background: "rgba(19,19,28,0.95)",
            border: "1px solid rgba(124,58,237,0.2)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header */}
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              fontWeight: 700,
              color: "#e8e8f0",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Вход
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "#6b6b8a",
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            Войдите в ваш аккаунт, чтобы продолжить
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <LoginInputField
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="user@example.com"
            />

            {/* Password field with show/hide */}
            <div className="flex flex-col gap-1.5">
              <label
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 12,
                  color: "#6b6b8a",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Пароль
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded outline-none transition-all pr-11"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(124,58,237,0.25)",
                    color: "#e8e8f0",
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.6)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.25)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-75 transition-opacity"
                  style={{ color: "#6b6b8a" }}
                >
                  {showPassword ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="mt-2" aria-live="polite">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(passwordLength / 8, 1) * 100}%`, background: passwordColor }} />
                </div>
                <div className="flex justify-between mt-1" style={{ fontSize: 11, color: passwordColor }}><span>{passwordLabel}</span><span>{passwordLength}/8</span></div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div
                className="px-4 py-3 rounded"
                style={{
                  background: "rgba(248,113,113,0.1)",
                  border: "1px solid rgba(248,113,113,0.3)",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    color: "#f87171",
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            {/* Remember me & Forgot password */}
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded"
                  style={{ accentColor: "#a855f7" }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    color: "#6b6b8a",
                  }}
                >
                  Запомнить меня
                </span>
              </label>
              <button
                type="button"
                onClick={() => onSwitchTo("forgot")}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "#a855f7",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                Забыли пароль?
              </button>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded font-semibold transition-all mt-4 hover:shadow-lg disabled:opacity-50"
              style={{
                background: loading
                  ? "rgba(124,58,237,0.5)"
                  : "linear-gradient(135deg, #7c3aed, #a855f7)",
                color: "#fff",
                fontFamily: "var(--font-display)",
                fontSize: 15,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                boxShadow: loading ? "none" : "0 4px 20px rgba(124,58,237,0.4)",
              }}
            >
              {loading ? "..." : "ВОЙТИ"}
            </button>
          </form>

          {/* OAuth Section */}
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex-1 h-px"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "#6b6b8a",
                }}
              >
                ИЛИ ВОЙТИ ЧЕРЕЗ
              </span>
              <div
                className="flex-1 h-px"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />
            </div>
            <div className="flex gap-3">
              <VKAuth />
              <GoogleAuth />
              <DiscordAuth />
            </div>
          </div>

          {/* Sign up link */}
          <div className="mt-6 text-center">
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "#6b6b8a",
              }}
            >
              Нет аккаунта?{" "}
              <button
                type="button"
                onClick={() => onSwitchTo("register")}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "#a855f7",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontWeight: 600,
                }}
              >
                Создайте его здесь
              </button>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
