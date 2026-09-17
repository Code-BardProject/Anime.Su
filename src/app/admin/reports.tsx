import { useState, useEffect } from "react";
import { adminApi } from "../../../services/adminApi";

interface Report {
  id: string;
  reporterId: {
    id: string;
    username: string;
    email: string;
  };
  targetId: string;
  targetType: 'comment' | 'user' | 'anime';
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt: string;
}

interface ReportsProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const statusColors: Record<Report['status'], string> = {
  pending: '#fbbf24',
  resolved: '#4ade80',
  dismissed: '#6b6b8a',
};

const statusLabels: Record<Report['status'], string> = {
  pending: 'На рассмотрении',
  resolved: 'Решено',
  dismissed: 'Отклонено',
};

const targetTypeLabels: Record<Report['targetType'], string> = {
  comment: 'Комментарий',
  user: 'Пользователь',
  anime: 'Аниме',
};

const targetTypeIcons: Record<Report['targetType'], string> = {
  comment: '💬',
  user: '👤',
  anime: '🎬',
};

export default function Reports({ onNavigate }: ReportsProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Report['status'] | 'all'>('all');
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminApi.getReports();
      if (result.success) {
        setReports((result.reports || result.data || []) as Report[]);
      } else {
        throw new Error(result.error || "Не удалось загрузить жалобы");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки жалоб");
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      const result = await adminApi.updateReport(reportId, status);
      if (result.success) {
        setReports(reports.map(r => 
          r.id === reportId ? { ...r, status } : r
        ));
      }
    } catch (err) {
      console.error('Failed to update report:', err);
    }
  };

  const handleBulkAction = async (status: 'resolved' | 'dismissed') => {
    try {
      const promises = Array.from(selectedReports).map(reportId => 
        handleUpdateReport(reportId, status)
      );
      await Promise.all(promises);
      setSelectedReports(new Set());
    } catch (err) {
      console.error('Bulk action failed:', err);
    }
  };

  const handleSelectReport = (reportId: string) => {
    const newSelected = new Set(selectedReports);
    if (newSelected.has(reportId)) {
      newSelected.delete(reportId);
    } else {
      newSelected.add(reportId);
    }
    setSelectedReports(newSelected);
  };

  const toggleExpand = (reportId: string) => {
    setExpandedReport(expandedReport === reportId ? null : reportId);
  };

  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(r => r.status === filter);

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>Загрузка жалоб...</p>
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
          onClick={loadReports}
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
            🚨 ЖАЛОБЫ
          </h2>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>
            Всего: {reports.length} | На рассмотрении: {pendingCount}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(['all', 'pending', 'resolved', 'dismissed'] as const).map((status) => (
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
      {selectedReports.size > 0 && (
        <div className="mb-6 p-4 rounded-xl flex items-center justify-between" style={{ 
          background: "rgba(124,58,237,0.1)", 
          border: "1px solid rgba(124,58,237,0.3)" 
        }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "#e8e8f0" }}>
            Выбрано: {selectedReports.size} жалоб
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('resolved')}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
              style={{ background: "rgba(74,222,128,0.2)", color: "#4ade80", fontFamily: "var(--font-display)" }}
            >
              ✓ Решить
            </button>
            <button
              onClick={() => handleBulkAction('dismissed')}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
              style={{ background: "rgba(107,107,138,0.2)", color: "#6b6b8a", fontFamily: "var(--font-display)" }}
            >
              ✗ Отклонить
            </button>
            <button
              onClick={() => setSelectedReports(new Set())}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
              style={{ background: "rgba(255,255,255,0.1)", color: "#6b6b8a", fontFamily: "var(--font-display)" }}
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-2xl" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
          <div className="text-6xl mb-4">🚨</div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#e8e8f0", letterSpacing: "0.1em" }}>
            НЕТ ЖАЛОБ
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a", marginTop: 8 }}>
            {filter !== 'all' ? `Нет жалоб со статусом "${statusLabels[filter]}"` : "Жалобы появятся здесь"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report, index) => (
            <div
              key={report.id}
              className="rounded-2xl overflow-hidden transition-all hover:scale-[1.01]"
              style={{ 
                background: "var(--card)", 
                border: `1px solid ${statusColors[report.status]}40`,
                boxShadow: report.status === 'pending' ? `0 0 20px ${statusColors[report.status]}20` : 'none'
              }}
            >
              {/* Report Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{targetTypeIcons[report.targetType]}</div>
                    <div>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "#e8e8f0", fontWeight: 600 }}>
                        {targetTypeLabels[report.targetType]}
                      </p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                        ID: {report.targetId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ 
                        background: `${statusColors[report.status]}20`, 
                        color: statusColors[report.status],
                        fontFamily: "var(--font-display)"
                      }}
                    >
                      {statusLabels[report.status]}
                    </span>
                    <input
                      type="checkbox"
                      checked={selectedReports.has(report.id)}
                      onChange={() => handleSelectReport(report.id)}
                      className="w-4 h-4 rounded cursor-pointer"
                      style={{ accentColor: "#a855f7" }}
                    />
                  </div>
                </div>

                {/* Reporter Info */}
                <div className="flex items-center gap-3 mb-4 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ 
                    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                    color: "#fff"
                  }}>
                    {report.reporterId?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <p style={{ fontFamily: "var(--font-display)", fontSize: 12, color: "#e8e8f0", fontWeight: 600 }}>
                      {report.reporterId?.username || 'Unknown'}
                    </p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a" }}>
                      {report.reporterId?.email || 'No email'}
                    </p>
                  </div>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a" }}>
                    {new Date(report.createdAt).toLocaleString('ru-RU')}
                  </p>
                </div>

                {/* Reason */}
                <div className="mb-4">
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                    Причина жалобы
                  </p>
                  <p style={{ 
                    fontFamily: "var(--font-display)", 
                    fontSize: 14, 
                    color: "#f87171", 
                    fontWeight: 600 
                  }}>
                    {report.reason}
                  </p>
                </div>

                {/* Expand/Collapse Description */}
                <button
                  onClick={() => toggleExpand(report.id)}
                  className="flex items-center gap-2 text-xs transition-all hover:scale-105"
                  style={{ color: "#a855f7", fontFamily: "var(--font-display)" }}
                >
                  {expandedReport === report.id ? '▼ Свернуть описание' : '▶ Показать описание'}
                </button>

                {/* Description (Collapsible) */}
                {expandedReport === report.id && (
                  <div className="mt-4 p-4 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                      Подробное описание
                    </p>
                    <p style={{ 
                      fontFamily: "var(--font-body)", 
                      fontSize: 13, 
                      color: "#a0a0b8", 
                      lineHeight: 1.6 
                    }}>
                      {report.description || 'Нет дополнительного описания'}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {report.status === 'pending' && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleUpdateReport(report.id, 'resolved')}
                      className="flex-1 py-3 rounded-lg text-sm font-semibold transition-all hover:scale-105"
                      style={{ background: "rgba(74,222,128,0.2)", color: "#4ade80", fontFamily: "var(--font-display)" }}
                    >
                      ✓ Решить жалобу
                    </button>
                    <button
                      onClick={() => handleUpdateReport(report.id, 'dismissed')}
                      className="flex-1 py-3 rounded-lg text-sm font-semibold transition-all hover:scale-105"
                      style={{ background: "rgba(107,107,138,0.2)", color: "#6b6b8a", fontFamily: "var(--font-display)" }}
                    >
                      ✗ Отклонить
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