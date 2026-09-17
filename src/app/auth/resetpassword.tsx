import { useState } from "react";
import { authApi } from "../../../services/authApi";
import { database } from "../../../services/database";

interface ResetPasswordProps {
  email: string;
  onSuccess: () => void;
  onSwitchTo: (mode: "login" | "forgot-password" | "reset-password") => void;
}

export default function ResetPassword({
  email,
  onSuccess,
  onSwitchTo,
}: ResetPasswordProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("минимум 8 символов");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("хотя бы одну заглавную букву");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("хотя бы одну строчную букву");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("хотя бы одну цифру");
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push("хотя бы один специальный символ (!@#$%^&*)");
    }

    return { valid: errors.length === 0, errors };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newPassword) {
      setError("Введите новый пароль");
      return;
    }

    if (!confirmPassword) {
      setError("Подтвердите пароль");
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      setError(
        `Пароль должен содержать: ${validation.errors.join(", ")}`
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);
    try {
      // Reset password through encrypted authApi
      setError("Сброс пароля должен выполняться из формы восстановления с кодом из письма");
      return;

      if (result.success) {
        // Also complete in database for audit trail
        const dbResult = await database.completePasswordReset(
          email,
          newPassword
        );

        if (dbResult.success) {
          setSuccess("Пароль успешно изменён! Перенаправление на страницу входа...");
          
          // Log the security event
          await database.logSecurityEvent("PASSWORD_RESET_COMPLETED", {
            email: email,
            timestamp: new Date().toISOString(),
          });

          setTimeout(() => {
            onSuccess();
            onSwitchTo("login");
          }, 2000);
        } else {
          setError(dbResult.error || "Ошибка при сохранении изменений");
        }
      } else {
        setError(result.error || "Ошибка при восстановлении пароля");
      }
    } catch (err) {
      setError("Ошибка при восстановлении пароля");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const validation = newPassword ? validatePassword(newPassword) : { valid: false, errors: [] };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            fontWeight: 700,
            color: "#e8e8f0",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Установить Новый Пароль
        </h1>
        <p
          style={{
            color: "#a0a0b8",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          Введите новый пароль для восстановления доступа к аккаунту {email}
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div
          style={{
            padding: "12px 16px",
            background: "rgba(74,222,128,0.1)",
            border: "1px solid rgba(74,222,128,0.3)",
            borderRadius: 6,
            marginBottom: 16,
          }}
        >
          <p style={{ color: "#4ade80", fontSize: 13 }}>{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "rgba(248,113,113,0.1)",
            border: "1px solid rgba(248,113,113,0.3)",
            borderRadius: 6,
            marginBottom: 16,
          }}
        >
          <p style={{ color: "#f87171", fontSize: 13 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New Password */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "#e8e8f0",
              marginBottom: 8,
              fontFamily: "var(--font-display)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Новый Пароль
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError("");
              }}
              placeholder="Минимум 8 символов"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 16px 12px 16px",
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.3)",
                borderRadius: 6,
                color: "#e8e8f0",
                fontSize: 14,
                fontFamily: "var(--font-body)",
                transition: "border-color 0.2s ease",
                paddingRight: 40,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(168,85,247,0.5)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(124,58,237,0.3)";
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#6b6b8a",
                cursor: "pointer",
                padding: 4,
              }}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>

          {/* Password Strength */}
          {newPassword && (
            <div style={{ marginTop: 8, fontSize: 12 }}>
              {validation.errors.map((error, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#f87171",
                    marginBottom: 4,
                  }}
                >
                  <span>✗</span>
                  <span>Требуется: {error}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "#e8e8f0",
              marginBottom: 8,
              fontFamily: "var(--font-display)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Подтвердите Пароль
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              placeholder="Повторите пароль"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "rgba(124,58,237,0.08)",
                border:
                  confirmPassword && newPassword !== confirmPassword
                    ? "1px solid rgba(248,113,113,0.5)"
                    : "1px solid rgba(124,58,237,0.3)",
                borderRadius: 6,
                color: "#e8e8f0",
                fontSize: 14,
                fontFamily: "var(--font-body)",
                transition: "border-color 0.2s ease",
                paddingRight: 40,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(168,85,247,0.5)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor =
                  confirmPassword && newPassword !== confirmPassword
                    ? "rgba(248,113,113,0.5)"
                    : "rgba(124,58,237,0.3)";
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#6b6b8a",
                cursor: "pointer",
                padding: 4,
              }}
            >
              {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>

          {/* Match indicator */}
          {confirmPassword && (
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                color:
                  newPassword === confirmPassword ? "#4ade80" : "#f87171",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{newPassword === confirmPassword ? "✓" : "✗"}</span>
              <span>
                {newPassword === confirmPassword
                  ? "Пароли совпадают"
                  : "Пароли не совпадают"}
              </span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !validation.valid || newPassword !== confirmPassword}
          style={{
            width: "100%",
            padding: "12px 16px",
            background:
              loading ||
              !validation.valid ||
              newPassword !== confirmPassword
                ? "rgba(124,58,237,0.3)"
                : "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
            border: "none",
            borderRadius: 6,
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "var(--font-display)",
            cursor:
              loading ||
              !validation.valid ||
              newPassword !== confirmPassword
                ? "not-allowed"
                : "pointer",
            transition: "all 0.2s ease",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginTop: 8,
          }}
          onMouseEnter={(e) => {
            if (
              !loading &&
              validation.valid &&
              newPassword === confirmPassword
            ) {
              e.currentTarget.style.transform = "translateY(-2px)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {loading ? "Обновление пароля..." : "Установить Новый Пароль"}
        </button>
      </form>

      {/* Back Link */}
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <button
          onClick={() => onSwitchTo("login")}
          style={{
            background: "none",
            border: "none",
            color: "#a855f7",
            fontSize: 13,
            fontFamily: "var(--font-display)",
            cursor: "pointer",
            textDecoration: "underline",
            letterSpacing: "0.06em",
          }}
          className="hover:text-purple-400 transition-colors"
        >
          ← Вернуться к входу
        </button>
      </div>
    </div>
  );
}
