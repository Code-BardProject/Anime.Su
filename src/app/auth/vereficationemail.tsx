import { useState, useRef, useEffect } from "react";
import { verifyEmail, resendVerificationEmail } from "../../../services/userApi";

interface EmailVerificationProps {
  email?: string;
  onSuccess: () => void;
  onSwitchTo: (mode: "login") => void;
}

export default function EmailVerification({ 
  email = "", 
  onSuccess, 
  onSwitchTo 
}: EmailVerificationProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const normalizedEmail = email.trim().toLowerCase();

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleCodeChange = (index: number, value: string) => {
    const sanitizedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");

    if (!sanitizedValue) {
      const newCode = [...code];
      newCode[index] = "";
      setCode(newCode);
      return;
    }

    if (sanitizedValue.length > 1) return;

    const newCode = [...code];
    newCode[index] = sanitizedValue;
    setCode(newCode);

    if (sanitizedValue && index < 5) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 0);
    }

    if (error) {
      setError("");
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "");

    if (pastedText.length >= 6) {
      const newCode = pastedText.slice(0, 6).split("");
      setCode(newCode);
      setTimeout(() => {
        inputRefs.current[5]?.focus();
      }, 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!normalizedEmail) {
      setError("Не удалось определить email. Вернитесь к регистрации и попробуйте снова");
      return;
    }

    const fullCode = code.join("").toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(fullCode)) {
      setError("Введите полный 6-символьный код");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyEmail({
        email: normalizedEmail,
        code: fullCode,
      });
      
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || "Неверный код подтверждения");
      }
    } catch (err) {
      setError("Ошибка при проверке кода");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!normalizedEmail || resendLoading || resendCountdown > 0) {
      if (!normalizedEmail) {
        setError("Не удалось определить email. Вернитесь к регистрации и попробуйте снова");
      }
      return;
    }

    setError("");
    setResendLoading(true);
    try {
      const res = await resendVerificationEmail(normalizedEmail);
      if (res.success) {
        setResendCountdown(60);
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setError(res.error || "Ошибка при отправке кода");
      }
    } catch (err) {
      setError("Ошибка при отправке кода");
    } finally {
      setResendLoading(false);
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
          {/* Verification icon */}
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
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
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
            Подтвердите Email
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "#6b6b8a",
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            Мы отправили код подтверждения на
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "#a855f7",
              textAlign: "center",
              marginBottom: 24,
              fontWeight: 500,
            }}
          >
            {normalizedEmail || "email не указан"}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Code input fields */}
            <div>
              <label
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 12,
                  color: "#6b6b8a",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: 12,
                  textAlign: "center",
                }}
              >
                Введите 6-символьный код
              </label>

              <div className="flex gap-3 justify-center">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-14 rounded text-center outline-none transition-all font-bold text-lg"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: error
                        ? "2px solid rgba(248,113,113,0.5)"
                        : digit
                        ? "2px solid rgba(168,85,247,0.6)"
                        : "2px solid rgba(124,58,237,0.25)",
                      color: "#e8e8f0",
                      fontFamily: "var(--font-display)",
                    }}
                    onFocus={(e) => {
                      if (!error) {
                        e.target.style.borderColor = "rgba(168,85,247,0.6)";
                      }
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = error
                        ? "rgba(248,113,113,0.5)"
                        : digit
                        ? "rgba(168,85,247,0.6)"
                        : "rgba(124,58,237,0.25)";
                    }}
                  />
                ))}
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
                    textAlign: "center",
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || code.join("").length !== 6}
              className="w-full py-3.5 rounded font-semibold transition-all hover:shadow-lg disabled:opacity-50"
              style={{
                background:
                  loading || code.join("").length !== 6
                    ? "rgba(124,58,237,0.5)"
                    : "linear-gradient(135deg, #7c3aed, #a855f7)",
                color: "#fff",
                fontFamily: "var(--font-display)",
                fontSize: 15,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                boxShadow:
                  loading || code.join("").length !== 6
                    ? "none"
                    : "0 4px 20px rgba(124,58,237,0.4)",
              }}
            >
              {loading ? "ПРОВЕРКА..." : "ПОДТВЕРДИТЬ"}
            </button>
          </form>

          {/* Resend section */}
          <div
            className="mt-6 p-4 rounded"
            style={{
              background: "rgba(124,58,237,0.05)",
              border: "1px solid rgba(124,58,237,0.15)",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "#6b6b8a",
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              Не получили код?
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={!normalizedEmail || resendCountdown > 0 || resendLoading}
              className="w-full py-2.5 rounded transition-all"
              style={{
                background:
                  !normalizedEmail || resendCountdown > 0 || resendLoading
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(168,85,247,0.1)",
                border:
                  !normalizedEmail || resendCountdown > 0 || resendLoading
                    ? "1px solid rgba(124,58,237,0.15)"
                    : "1px solid rgba(168,85,247,0.3)",
                color:
                  !normalizedEmail || resendCountdown > 0 || resendLoading ? "#6b6b8a" : "#a855f7",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                fontWeight: 500,
                cursor:
                  !normalizedEmail || resendCountdown > 0 || resendLoading ? "not-allowed" : "pointer",
              }}
            >
              {resendCountdown > 0
                ? `Отправить снова через ${resendCountdown}с`
                : resendLoading
                ? "ОТПРАВКА..."
                : "ОТПРАВИТЬ КОД СНОВА"}
            </button>
          </div>

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

          {/* Helper text */}
          <div
            className="mt-6 p-3 rounded"
            style={{
              background: "rgba(124,58,237,0.06)",
              border: "1px solid rgba(124,58,237,0.15)",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "#6b6b8a",
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              💡 Код состоит из 6 символов: цифры и буквы. Можно вставить код целиком в первое поле.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
