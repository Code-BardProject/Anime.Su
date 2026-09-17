import { useState } from "react";
import { authApi } from "../../../services/authApi";
import { database } from "../../../services/database";

interface ForgotPasswordProps {
  onSuccess: () => void;
  onSwitchTo: (mode: "login") => void;
}

export default function ForgotPassword({ onSuccess, onSwitchTo }: ForgotPasswordProps) {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Введите email");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Некорректный email");
      return;
    }

    setLoading(true);
    try {
      // Request password reset through encrypted authApi
      const authRes = await authApi.forgotPassword(email);
      
      if (authRes.success) {
        // Also store in database for audit trail
        const dbRes = await database.createPasswordReset(email);
        
        if (dbRes.success) {
          setEmailSent(true);
          setStep("reset");
        } else {
          setError(dbRes.error || "Ошибка при сохранении запроса");
        }
      } else {
        setError(authRes.error || "Ошибка при отправке письма");
      }
    } catch (err) {
      setError("Ошибка при отправке письма");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!resetCode) {
      setError("Введите код из письма");
      return;
    }

    if (!newPassword) {
      setError("Введите новый пароль");
      return;
    }

    if (newPassword.length < 6) {
      setError("Пароль должен быть минимум 6 символов");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);
    try {
      // First verify the reset code through encrypted authApi
      const verifyRes = await authApi.verifyResetCode(email, resetCode);
      
      if (verifyRes.success) {
        // Then reset the password through encrypted authApi
        const resetRes = await authApi.resetPassword(email, resetCode, newPassword, confirmPassword);
        
        if (resetRes.success) {
          // Also complete in database
          const dbRes = await database.completePasswordReset(email, newPassword);
          
          if (dbRes.success) {
            onSuccess();
          } else {
            setError(dbRes.error || "Ошибка при завершении восстановления");
          }
        } else {
          setError(resetRes.error || "Ошибка при восстановлении пароля");
        }
      } else {
        setError(verifyRes.error || "Ошибка при проверке кода");
      }
    } catch (err) {
      setError("Ошибка при восстановлении пароля");
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({
    label,
    type,
    value,
    onChange,
    placeholder,
    error: fieldError,
  }: {
    label: string;
    type: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    error?: string;
  }) => (
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
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        className="w-full px-4 py-3 rounded outline-none transition-all"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: fieldError ? "1px solid rgba(248,113,113,0.5)" : "1px solid rgba(124,58,237,0.25)",
          color: "#e8e8f0",
          fontFamily: "var(--font-body)",
          fontSize: 14,
        }}
        onFocus={(e) => {
          if (!fieldError) {
            e.target.style.borderColor = "rgba(168,85,247,0.6)";
          }
        }}
        onBlur={(e) => {
          e.target.style.borderColor = fieldError ? "rgba(248,113,113,0.5)" : "rgba(124,58,237,0.25)";
        }}
      />
      {fieldError && (
        <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "#f87171" }}>
          {fieldError}
        </span>
      )}
    </div>
  );

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
          {step === "email" ? (
            <>
              {/* Recovery icon */}
              <div className="flex justify-center mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: "rgba(124,58,237,0.1)",
                    border: "2px solid rgba(124,58,237,0.3)",
                  }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2"
                  >
                    <path d="M3 11l8-9 8 9M5 20h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2z" />
                  </svg>
                </div>
              </div>

              {/* Header */}
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 26,
                  fontWeight: 700,
                  color: "#e8e8f0",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Восстановление
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
                Введите email вашего аккаунта, и мы отправим ссылку восстановления
              </p>

              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                <InputField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="user@example.com"
                  error={error && !resetCode ? error : undefined}
                />

                {/* Error message */}
                {error && !resetCode && (
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

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded font-semibold transition-all mt-2 hover:shadow-lg disabled:opacity-50"
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
                  {loading ? "..." : "ОТПРАВИТЬ ПИСЬМО"}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Reset form */}
              <div className="flex justify-center mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: "rgba(124,58,237,0.1)",
                    border: "2px solid rgba(124,58,237,0.3)",
                  }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2"
                  >
                    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm3.6-14.4a1.6 1.6 0 11-3.2 0 1.6 1.6 0 013.2 0zM9.4 15.6a1.6 1.6 0 11-3.2 0 1.6 1.6 0 013.2 0z" />
                  </svg>
                </div>
              </div>

              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 26,
                  fontWeight: 700,
                  color: "#e8e8f0",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Новый пароль
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
                Письмо отправлено на {email}. Введите код и новый пароль
              </p>

              <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
                <InputField
                  label="Код из письма"
                  type="text"
                  value={resetCode}
                  onChange={(e) => {
                    setResetCode(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Например: ABC123DEF456"
                  error={error && step === "reset" ? error : undefined}
                />

                {/* New Password */}
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
                    Новый пароль
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (error) setError("");
                      }}
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
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError("");
                      }}
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

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded font-semibold transition-all mt-2 hover:shadow-lg disabled:opacity-50"
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
                  {loading ? "..." : "ВОССТАНОВИТЬ ПАРОЛЬ"}
                </button>

                {/* Back button */}
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setResetCode("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="w-full py-2.5 rounded font-semibold transition-all"
                  style={{
                    background: "rgba(124,58,237,0.1)",
                    border: "1px solid rgba(124,58,237,0.3)",
                    color: "#a855f7",
                    fontFamily: "var(--font-display)",
                    fontSize: 13,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  ← Назад
                </button>
              </form>
            </>
          )}

          {/* Back to login */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => onSwitchTo("login")}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "#6b6b8a",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              Вернуться на вход
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
