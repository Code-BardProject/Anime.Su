import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { adminApi } from "../../../services/adminApi";

interface AdminEmailVerificationProps {
  onSuccess: () => void;
}

export default function AdminEmailVerification({ onSuccess }: AdminEmailVerificationProps) {
  const { user, updateUser } = useAuth();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => inputRefs.current[0]?.focus(), []);
  useEffect(() => {
    if (!resendCountdown) return;
    const timer = window.setTimeout(() => setResendCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  const setDigit = (index: number, value: string) => {
    const next = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-1);
    setCode((current) => current.map((item, itemIndex) => itemIndex === index ? next : item));
    setError("");
    if (next && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const email = user?.email || "";
    const value = code.join("");
    if (!email || value.length !== 6) {
      setError("Введите полный 6-символьный код");
      return;
    }
    setLoading(true);
    const result = await adminApi.verifyEmail(email, value);
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Не удалось подтвердить email");
      return;
    }
    updateUser({ emailVerified: true });
    onSuccess();
  };

  const resend = async () => {
    if (!user?.email || resendCountdown) return;
    setResendLoading(true);
    const result = await adminApi.resendVerificationEmail(user.email);
    setResendLoading(false);
    if (!result.success) {
      setError(result.error || "Не удалось отправить код");
      return;
    }
    setCode(["", "", "", "", "", ""]);
    setResendCountdown(60);
    inputRefs.current[0]?.focus();
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--background)" }}>
      <section className="w-full max-w-md rounded-xl p-8" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <p style={{ color: "var(--accent)", fontFamily: "var(--font-display)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Anime.Su Admin</p>
        <h1 className="mt-3 mb-2" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)", fontSize: 28 }}>Подтвердите email</h1>
        <p className="mb-6" style={{ color: "var(--muted-foreground)" }}>Код из письма отправлен на {user?.email || "ваш email"}.</p>
        <form onSubmit={submit}>
          <div className="flex justify-center gap-2 mb-5">
            {code.map((digit, index) => (
              <input key={index} ref={(element) => { inputRefs.current[index] = element; }} value={digit} maxLength={1} inputMode="text" disabled={loading} onChange={(event) => setDigit(index, event.target.value)} onKeyDown={(event) => { if (event.key === "Backspace" && !digit && index > 0) inputRefs.current[index - 1]?.focus(); }} className="w-11 h-12 text-center rounded outline-none" style={{ background: "var(--muted)", border: `1px solid ${error ? "#f87171" : "var(--border)"}`, color: "var(--foreground)", fontSize: 20 }} />
            ))}
          </div>
          {error && <p className="mb-4" style={{ color: "#f87171" }}>{error}</p>}
          <button type="submit" disabled={loading || code.join("").length !== 6} className="w-full rounded px-4 py-3" style={{ background: "var(--primary)", color: "#fff", opacity: loading || code.join("").length !== 6 ? 0.5 : 1 }}>{loading ? "Проверка..." : "Подтвердить email"}</button>
        </form>
        <button type="button" onClick={resend} disabled={resendLoading || Boolean(resendCountdown)} className="w-full mt-5" style={{ color: "var(--accent)", background: "transparent", border: 0 }}>{resendLoading ? "Отправка..." : resendCountdown ? `Отправить снова через ${resendCountdown}с` : "Отправить код ещё раз"}</button>
      </section>
    </main>
  );
}