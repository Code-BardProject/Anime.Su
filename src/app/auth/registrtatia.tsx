import { useState } from "react";
import { registerUser } from "../../../services/userApi";
import { useAuth, type User } from "../../context/AuthContext";
import GoogleAuth from "./googleAuth";
import DiscordAuth from "./discord";
import VKAuth from "./vk";

interface RegistrationProps {
  onSuccess: (email: string) => void;
  onBack: () => void;
  onSwitchTo: (mode: "login" | "verify") => void;
}

function RegistrationInputField({ label, type, name, value, onChange, placeholder, error: fieldError }: {
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

export default function Registration({ onSuccess, onBack, onSwitchTo }: RegistrationProps) {
  const { setUser } = useAuth();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const passwordLength = form.password.length;
  const passwordStrength = passwordLength < 6
    ? { label: "Слабый пароль", color: "#f87171", width: `${Math.min(passwordLength / 8, 1) * 100}%` }
    : passwordLength < 8
      ? { label: "Средний пароль", color: "#fb923c", width: `${(passwordLength / 8) * 100}%` }
      : { label: "Надёжный пароль", color: "#4ade80", width: "100%" };
  const confirmPasswordMatches = form.confirmPassword.length > 0 && form.password === form.confirmPassword;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.username.trim()) {
      newErrors.username = "Никнейм не может быть пустым";
    } else if (form.username.length < 3) {
      newErrors.username = "Никнейм должен быть минимум 3 символа";
    } else if (form.username.length > 20) {
      newErrors.username = "Никнейм не более 20 символов";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email не может быть пустым";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Некорректный email";
    }

    if (!form.password) {
      newErrors.password = "Пароль не может быть пустым";
    } else if (form.password.length < 8) {
      newErrors.password = "Пароль должен быть минимум 8 символов";
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Пароли не совпадают";
    }

    if (!agreedToTerms) {
      newErrors.terms = "Необходимо согласиться с условиями";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const username = form.username.trim();
      const email = form.email.trim().toLowerCase();
      const result = await registerUser({ username, email, password: form.password });

      if (result.success) {
        const serverUser = result.data?.user as Record<string, unknown> | undefined;
        if (serverUser) {
          const nextUser: User = {
            id: Number(serverUser.id ?? Date.now()),
            username: String(serverUser.username || form.username),
            email: String(serverUser.email || form.email),
            avatar: String(serverUser.avatar || serverUser.username || form.username || "U").charAt(0).toUpperCase(),
            role: "USER",
            joinDate: new Date().toLocaleDateString("ru"),
            isPremium: false,
            emailVerified: false,
            stats: { watching: 0, completed: 0, planned: 0, dropped: 0 },
          };
          setUser(nextUser);
        }

        // Store token if provided
        if (result.token) {
          localStorage.setItem("animeSuAuthToken", result.token);
        }

        onSuccess(email);
      } else {
        setErrors({ general: result.error ?? "Не удалось завершить регистрацию." });
      }
    } catch {
      setErrors({ general: "Не удалось подключиться к серверу. Проверьте соединение и повторите попытку." });
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
            Регистрация
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
            Создайте аккаунт для доступа к сервису
          </p>

          {/* General error */}
          {errors.general && (
            <div
              className="px-4 py-3 rounded mb-4"
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
                {errors.general}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <RegistrationInputField
              label="Никнейм"
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="KiritoFan_2024"
              error={errors.username}
            />

            <RegistrationInputField
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="user@example.com"
              error={errors.email}
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
                    border: errors.password ? "1px solid rgba(248,113,113,0.5)" : "1px solid rgba(124,58,237,0.25)",
                    color: "#e8e8f0",
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                  }}
                  onFocus={(e) => {
                    if (!errors.password) {
                      e.target.style.borderColor = "rgba(168,85,247,0.6)";
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.password ? "rgba(248,113,113,0.5)" : "rgba(124,58,237,0.25)";
                  }}
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
                  <div className="h-full rounded-full transition-all" style={{ width: passwordStrength.width, background: passwordStrength.color }} />
                </div>
                <div className="flex justify-between mt-1" style={{ fontSize: 11, color: passwordStrength.color }}><span>{passwordStrength.label}</span><span>{passwordLength}/8</span></div>
                <p style={{ color: "#6b6b8a", fontSize: 11, marginTop: 3 }}>Минимум 8 символов. Разрешены буквы, цифры и специальные знаки.</p>
              </div>
              {errors.password && (
                <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "#f87171" }}>
                  {errors.password}
                </span>
              )}
            </div>

            {/* Confirm password */}
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
                Подтвердите пароль
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded outline-none transition-all pr-11"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: errors.confirmPassword ? "1px solid rgba(248,113,113,0.5)" : "1px solid rgba(124,58,237,0.25)",
                    color: "#e8e8f0",
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                  }}
                  onFocus={(e) => {
                    if (!errors.confirmPassword) {
                      e.target.style.borderColor = "rgba(168,85,247,0.6)";
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.confirmPassword ? "rgba(248,113,113,0.5)" : "rgba(124,58,237,0.25)";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-75 transition-opacity"
                  style={{ color: "#6b6b8a" }}
                >
                  {showConfirm ? (
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
              {errors.confirmPassword && (
                <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "#f87171" }}>
                  {errors.confirmPassword}
                </span>
              )}
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: form.confirmPassword ? "100%" : "0%", background: confirmPasswordMatches ? "#4ade80" : "#f87171" }} />
              </div>
              {form.confirmPassword && <p style={{ color: confirmPasswordMatches ? "#4ade80" : "#f87171", fontSize: 11, marginTop: 4 }}>{confirmPasswordMatches ? "Пароли совпадают" : "Пароли не совпадают"}</p>}
            </div>

            {/* Terms agreement */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => {
                  setAgreedToTerms(e.target.checked);
                  if (e.target.checked && errors.terms) {
                    setErrors((prev) => ({ ...prev, terms: "" }));
                  }
                }}
                className="mt-1"
                style={{ accentColor: "#a855f7" }}
              />
              <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#6b6b8a", lineHeight: 1.4 }}>
                Я согласен с{" "}
                <span style={{ color: "#a855f7" }}>условиями использования</span> и{" "}
                <span style={{ color: "#a855f7" }}>политикой конфиденциальности</span>
              </span>
            </div>
            {errors.terms && (
              <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "#f87171" }}>
                {errors.terms}
              </span>
            )}

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
              {loading ? "..." : "СОЗДАТЬ АККАУНТ"}
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
                ИЛИ ЗАРЕГИСТРИРОВАТЬСЯ ЧЕРЕЗ
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

          {/* Sign in link */}
          <div className="mt-6 text-center">
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "#6b6b8a",
              }}
            >
              Уже есть аккаунт?{" "}
              <button
                type="button"
                onClick={() => onSwitchTo("login")}
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
                Войдите здесь
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
