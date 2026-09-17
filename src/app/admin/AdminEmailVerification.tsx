import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { adminApi } from "../../../services/adminApi";

interface AdminEmailVerificationProps {
  onSuccess: () => void;
}

export default function AdminEmailVerification({ onSuccess }: AdminEmailVerificationProps) {
  const { user, verifyAdminEmail } = useAuth();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
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
    if (!/^[a-zA-Z0-9]*$/.test(value)) return;
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
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
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").replace(/\D/g, "");
    
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

    const fullCode = code.join("").toUpperCase();
    if (fullCode.length !== 6) {
      setError("Введите все 6 цифр");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyAdminEmail(fullCode);
      
      if (res.ok) {
        onSuccess();
      } else {
        setError(res.error || "Ошибка верификации");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError("Ошибка при проверке кода");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!user?.email || resendCountdown > 0) return;
    const result = await adminApi.resendVerificationEmail(user.email);
    if (!result.success) {
      setError(result.error || "Не удалось отправить новый код");
      return;
    }
    setResendCountdown(60);
    setError("");
    setCode(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-md rounded-lg p-8" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.15)" }}>
        {/* Header */}
        <div className="mb-8">
          <h1 style={{ 
            fontFamily: "var(--font-display)", 
            fontSize: 24, 
            fontWeight: 700, 
            color: "#e8e8f0", 
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 8
          }}>
            Верификация Email
          </h1>
          <p style={{ color: "#a0a0b8", fontSize: 14, lineHeight: 1.5 }}>
            Администратор, на вашу почту {user?.email} отправлен код верификации. Введите его ниже:
          </p>
        </div>

        {/* Code inputs */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-2 justify-center mb-6">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={el => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={loading}
                style={{
                  width: 50,
                  height: 50,
                  fontSize: 24,
                  fontWeight: 700,
                  textAlign: "center",
                  background: "rgba(124,58,237,0.08)",
                  border: `2px solid ${error ? "#f87171" : "rgba(124,58,237,0.3)"}`,
                  color: "#e8e8f0",
                  borderRadius: 8,
                  transition: "border-color 0.2s ease",
                }}
                className="transition-all focus:outline-none"
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(168,85,247,0.5)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = error ? "#f87171" : "rgba(124,58,237,0.3)";
                }}
              />
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div style={{ padding: "12px 16px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 6 }}>
              <p style={{ color: "#f87171", fontSize: 13, fontFamily: "var(--font-body)" }}>
                {error}
              </p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || code.join("").length !== 6}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: loading || code.join("").length !== 6 ? "rgba(124,58,237,0.3)" : "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "var(--font-display)",
              cursor: loading || code.join("").length !== 6 ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              letterSpacing: "0.06em",
              textTransform: "uppercase"
            }}
            className="transition-all hover:shadow-lg"
            onMouseEnter={(e) => {
              if (!loading && code.join("").length === 6) {
                e.currentTarget.style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {loading ? "Проверка..." : "Подтвердить"}
          </button>
        </form>

        {/* Resend info */}
        <div className="mt-6 text-center">
          <p style={{ fontSize: 13, color: "#6b6b8a", marginBottom: 8 }}>
            Не получили код?
          </p>
          <button
            onClick={handleResend}
            disabled={resendCountdown > 0}
            style={{
              background: "none",
              border: "none",
              color: resendCountdown > 0 ? "#6b6b8a" : "#a855f7",
              fontSize: 13,
              fontFamily: "var(--font-display)",
              cursor: resendCountdown > 0 ? "not-allowed" : "pointer",
              textDecoration: "underline",
              transition: "color 0.2s ease"
            }}
            className="hover:text-purple-400 transition-colors"
          >
            {resendCountdown > 0 ? `Отправить снова через ${resendCountdown}с` : "Отправить код еще раз"}
          </button>
        </div>

      </div>
    </div>
  );
}
