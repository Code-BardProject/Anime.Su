import { useEffect, useMemo, useState } from "react";
import { database } from "../../../services/database";
import { adminApi } from "../../../services/adminApi";

interface ChatMessage {
  id: string;
  userId?: string;
  userName?: string;
  email?: string;
  text: string;
  createdAt?: string;
  role?: "admin" | "user" | "system";
}

export default function AdminChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await database.loadChatMessages();
      if (!result.success) {
        throw new Error(result.error || "Failed to load chat messages");
      }
      const list = Array.isArray(result.data) ? (result.data as ChatMessage[]) : [];
      setMessages(list);
    } catch (err) {
      console.error("Failed to load chat messages:", err);
      setError(err instanceof Error ? err.message : "Failed to load chat messages");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMessages();
  }, []);

  const sendMessage = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;

    try {
      setSending(true);
      setError(null);
      const now = new Date().toISOString();
      const payload = {
        userId: "admin",
        userName: "Admin",
        email: "admin@animesu.local",
        text: trimmed,
        createdAt: now,
        role: "admin",
      };

      const result = await database.sendChatMessage(payload);
      if (!result.success) {
        throw new Error(result.error || "Failed to send message");
      }

      const saved = result.data && typeof result.data === "object" && "id" in (result.data as Record<string, unknown>)
        ? (result.data as ChatMessage)
        : { ...payload, id: String(Date.now()) };

      setMessages((current) => [...current, saved as ChatMessage]);
      setDraft("");

      await adminApi.createNotification({
        title: "Admin chat",
        type: "info",
        message: `Новое сообщение от ${payload.userName}: ${trimmed}`,
        createdAt: now,
        isRead: false,
      });
    } catch (err) {
      console.error("Failed to send chat message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const latest = useMemo(() => messages[messages.length - 1], [messages]);

  return (
    <div className="rounded p-6" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            ADMIN CHAT
          </h2>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a", marginTop: 4 }}>
            {messages.length} сообщений
          </p>
        </div>
        <button
          onClick={() => void loadMessages()}
          className="px-4 py-2 rounded text-sm"
          style={{ background: "rgba(124,58,237,0.1)", color: "#a855f7", fontFamily: "var(--font-display)" }}
        >
          Обновить
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171" }}>
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="max-h-80 overflow-auto rounded p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.1)" }}>
          {loading ? (
            <div className="text-center" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>Загрузка...</div>
          ) : messages.length === 0 ? (
            <div className="text-center" style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#a0a0b8" }}>
              Чат пуст
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id || `${message.createdAt}-${message.text}`} className="mb-3 rounded p-3" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.1)" }}>
                <div className="flex items-center justify-between gap-4">
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, color: "#e8e8f0" }}>
                    {message.role === "admin" ? "Admin" : message.userName || message.email || "User"}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a" }}>
                    {message.createdAt ? new Date(message.createdAt).toLocaleString() : "now"}
                  </span>
                </div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#a0a0b8", marginTop: 8, whiteSpace: "pre-wrap" }}>
                  {message.text}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void sendMessage();
              }
            }}
            placeholder="Напишите сообщение..."
            className="flex-1 px-4 py-3 rounded outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)" }}
          />
          <button
            onClick={() => void sendMessage()}
            disabled={sending || !draft.trim()}
            className="px-5 py-3 rounded font-semibold disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", fontFamily: "var(--font-display)" }}
          >
            {sending ? "..." : "Отправить"}
          </button>
        </div>

        {latest && (
          <div className="rounded p-3" style={{ background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)", color: "#4ade80" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>Последнее:</span> {latest.text}
          </div>
        )}
      </div>
    </div>
  );
}
