import { useState, useEffect } from "react";
import { adminApi } from "../../../services/adminApi";

interface Comment {
  id: string;
  userId?: string | {
    id?: string;
    username?: string;
    email?: string;
    avatar?: string;
  };
  userName?: string;
  email?: string;
  avatar?: string;
  animeId?: string | number;
  animeTitle?: string;
  anime?: { id?: string | number; title?: string };
  text?: string;
  content?: string;
  sticker?: string;
  status: 'pending' | 'approved' | 'deleted' | string;
  createdAt: string;
  updatedAt: string;
}

interface CommentsProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const statusColors: Record<string, string> = {
  pending: '#fbbf24',
  approved: '#4ade80',
  deleted: '#f87171',
};

const statusLabels: Record<string, string> = {
  pending: 'На модерации',
  approved: 'Одобрено',
  deleted: 'Удалено',
};

export default function Comments({ onNavigate }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Comment['status'] | 'all'>('all');
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminApi.getComments();
      if (result.success) {
        setComments((result.comments || result.data || []) as Comment[]);
      } else {
        throw new Error(result.error || "Не удалось загрузить комментарии");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки комментариев");
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleModerateComment = async (commentId: string, action: 'approve' | 'delete' | 'ban') => {
    try {
      const result = await adminApi.moderateComment(commentId, action);
      if (result.success) {
        setComments(comments.map(c => 
          c.id === commentId 
            ? { ...c, status: action === 'approve' ? 'approved' : 'deleted' }
            : c
        ));
      }
    } catch (err) {
      console.error('Failed to moderate comment:', err);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'delete') => {
    try {
      const promises = Array.from(selectedComments).map(commentId => 
        handleModerateComment(commentId, action)
      );
      await Promise.all(promises);
      setSelectedComments(new Set());
    } catch (err) {
      console.error('Bulk action failed:', err);
    }
  };

  const handleSelectComment = (commentId: string) => {
    const newSelected = new Set(selectedComments);
    if (newSelected.has(commentId)) {
      newSelected.delete(commentId);
    } else {
      newSelected.add(commentId);
    }
    setSelectedComments(newSelected);
  };

  const filteredComments = filter === 'all' 
    ? comments 
    : comments.filter(c => c.status === filter);

  const pendingCount = comments.filter(c => c.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>Загрузка комментариев...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-6xl mb-4">⚠️</div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#f87171", marginBottom: 12 }}>{error}</p>
        <button
          onClick={loadComments}
          className="px-6 py-3 rounded-lg text-sm font-semibold transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", fontFamily: "var(--font-display)" }}
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
            💬 КОММЕНТАРИИ
          </h2>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>
            Всего: {comments.length} | Ожидают модерации: {pendingCount}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'deleted'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
              style={{
                background: filter === status ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
                color: filter === status ? "#a855f7" : "#6b6b8a",
                fontFamily: "var(--font-display)",
                border: filter === status ? "1px solid rgba(124,58,237,0.3)" : "1px solid rgba(255,255,255,0.08)"
              }}
            >
              {status === 'all' ? 'Все' : statusLabels[status]}
              {status === 'pending' && pendingCount > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{ background: "#f87171", color: "#fff" }}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedComments.size > 0 && (
        <div className="mb-6 p-4 rounded-xl flex items-center justify-between" style={{ 
          background: "rgba(124,58,237,0.1)", 
          border: "1px solid rgba(124,58,237,0.3)" 
        }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "#e8e8f0" }}>
            Выбрано: {selectedComments.size} комментариев
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('approve')}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
              style={{ background: "rgba(74,222,128,0.2)", color: "#4ade80", fontFamily: "var(--font-display)" }}
            >
              ✓ Одобрить
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
              style={{ background: "rgba(248,113,113,0.2)", color: "#f87171", fontFamily: "var(--font-display)" }}
            >
              ✗ Удалить
            </button>
            <button
              onClick={() => setSelectedComments(new Set())}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
              style={{ background: "rgba(255,255,255,0.1)", color: "#6b6b8a", fontFamily: "var(--font-display)" }}
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Comments List */}
      {filteredComments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-2xl" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
          <div className="text-6xl mb-4">💬</div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#e8e8f0", letterSpacing: "0.1em" }}>
            НЕТ КОММЕНТАРИЕВ
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a", marginTop: 8 }}>
            {filter !== 'all' ? `Нет комментариев со статусом "${statusLabels[filter]}"` : "Комментарии появятся здесь"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComments.map((comment, index) => (
            <div
              key={comment.id}
              className="rounded-2xl p-6 transition-all hover:scale-[1.01]"
              style={{ 
                background: "var(--card)", 
                border: `1px solid ${statusColors[comment.status]}40`,
                boxShadow: comment.status === 'pending' ? `0 0 20px ${statusColors[comment.status]}20` : 'none'
              }}
            >
              {/* Comment Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ 
                    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                    color: "#fff"
                  }}>
                    {(comment.userName || (typeof comment.userId === "object" ? comment.userId.username : "") || comment.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "#e8e8f0", fontWeight: 600 }}>
                      {comment.userName || (typeof comment.userId === "object" ? comment.userId.username : "") || comment.email || 'Unknown'}
                    </p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                      {(typeof comment.userId === "object" ? comment.userId.email : "") || comment.email || 'No email'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ 
                      background: `${statusColors[comment.status]}20`, 
                      color: statusColors[comment.status],
                      fontFamily: "var(--font-display)"
                    }}
                  >
                    {statusLabels[comment.status]}
                  </span>
                  <input
                    type="checkbox"
                    checked={selectedComments.has(comment.id)}
                    onChange={() => handleSelectComment(comment.id)}
                    className="w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: "#a855f7" }}
                  />
                </div>
              </div>

              {/* Comment Content */}
              <div className="mb-4">
                {(comment.animeTitle || comment.anime?.title) && (
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a", marginBottom: 8 }}>
                    К аниме: {comment.animeTitle || comment.anime?.title}
                  </p>
                )}
                <p style={{ 
                  fontFamily: "var(--font-body)", 
                  fontSize: 14, 
                  color: "#a0a0b8", 
                  lineHeight: 1.6,
                  background: "rgba(255,255,255,0.02)",
                  padding: "12px",
                  borderRadius: "8px"
                }}>
                  {comment.text || comment.content}
                </p>
                {comment.sticker && (
                  <img src={comment.sticker} alt="Стикер в комментарии" className="mt-3 h-24 w-24 object-contain rounded" />
                )}
              </div>

              {/* Comment Footer */}
              <div className="flex items-center justify-between">
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                  {new Date(comment.createdAt).toLocaleString('ru-RU')}
                </p>

                {comment.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleModerateComment(comment.id, 'approve')}
                      className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                      style={{ background: "rgba(74,222,128,0.2)", color: "#4ade80", fontFamily: "var(--font-display)" }}
                    >
                      ✓ Одобрить
                    </button>
                    <button
                      onClick={() => handleModerateComment(comment.id, 'delete')}
                      className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                      style={{ background: "rgba(248,113,113,0.2)", color: "#f87171", fontFamily: "var(--font-display)" }}
                    >
                      ✗ Удалить
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}