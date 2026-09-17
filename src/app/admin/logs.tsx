import { useState, useEffect } from "react";
import { adminApi } from "../../../services/adminApi";

interface LogEntry {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'system';
  action: string;
  userId?: string;
  username?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

interface LogsProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const typeColors: Record<LogEntry['type'], string> = {
  info: '#22d3ee',
  warning: '#fbbf24',
  error: '#f87171',
  success: '#4ade80',
  system: '#a855f7',
};

const typeIcons: Record<LogEntry['type'] | 'all', string> = {
  all: '📋',
  info: 'ℹ️',
  warning: '⚠️',
  error: '❌',
  success: '✅',
  system: '⚙️',
};

const typeLabels: Record<LogEntry['type'] | 'all', string> = {
  all: 'Все',
  info: 'Информация',
  warning: 'Предупреждение',
  error: 'Ошибка',
  success: 'Успех',
  system: 'Система',
};

export default function Logs({ onNavigate }: LogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LogEntry['type'] | 'all'>('all');
  const [search, setSearch] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminApi.getLogs();
      if (result.success) {
        setLogs((result.items || result.data || []) as LogEntry[]);
      } else {
        throw new Error(result.error || "Не удалось загрузить логи");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки логов");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  const filteredLogs = logs.filter(log => {
    const matchesType = filter === 'all' || log.type === filter;
    const matchesSearch = !search || 
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.username?.toLowerCase().includes(search.toLowerCase()) ||
      log.details?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const errorCount = logs.filter(l => l.type === 'error').length;
  const warningCount = logs.filter(l => l.type === 'warning').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>Загрузка логов...</p>
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
          onClick={loadLogs}
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
            📋 ЛОГИ
          </h2>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>
            Всего: {logs.length} | Ошибок: {errorCount} | Предупреждений: {warningCount}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по логам..."
            className="w-full md:w-80 px-4 py-3 pl-12 rounded-xl outline-none transition-all"
            style={{ 
              background: "rgba(255,255,255,0.04)", 
              border: "1px solid rgba(124,58,237,0.25)", 
              color: "#e8e8f0", 
              fontFamily: "var(--font-body)", 
              fontSize: 14 
            }}
          />
          <svg 
            className="absolute left-4 top-1/2 -translate-y-1/2" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#6b6b8a" 
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'info', 'warning', 'error', 'success', 'system'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
            style={{
              background: filter === type ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
              color: filter === type ? "#a855f7" : "#6b6b8a",
              fontFamily: "var(--font-display)",
              border: filter === type ? "1px solid rgba(124,58,237,0.3)" : "1px solid rgba(255,255,255,0.08)"
            }}
          >
            {typeIcons[type]} {typeLabels[type]}
            {type === 'error' && errorCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{ background: "#f87171", color: "#fff" }}>
                {errorCount}
              </span>
            )}
            {type === 'warning' && warningCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{ background: "#fbbf24", color: "#000" }}>
                {warningCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-2xl" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
          <div className="text-6xl mb-4">📋</div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#e8e8f0", letterSpacing: "0.1em" }}>
            НЕТ ЛОГОВ
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a", marginTop: 8 }}>
            {search ? "По вашему запросу ничего не найдено" : "Логи появятся здесь после активности системы"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log, index) => (
            <div
              key={log.id}
              className="rounded-xl p-4 transition-all hover:scale-[1.01]"
              style={{ 
                background: "var(--card)", 
                border: `1px solid ${typeColors[log.type]}40`,
                borderLeft: `4px solid ${typeColors[log.type]}`
              }}
            >
              {/* Log Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{typeIcons[log.type]}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span 
                        className="px-2 py-0.5 rounded text-xs font-semibold"
                        style={{ 
                          background: `${typeColors[log.type]}20`, 
                          color: typeColors[log.type],
                          fontFamily: "var(--font-display)"
                        }}
                      >
                        {typeLabels[log.type]}
                      </span>
                      <p style={{ 
                        fontFamily: "var(--font-display)", 
                        fontSize: 14, 
                        color: "#e8e8f0", 
                        fontWeight: 600 
                      }}>
                        {log.action}
                      </p>
                    </div>
                    {log.username && (
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                        Пользователь: {log.username}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>
                    {new Date(log.timestamp).toLocaleString('ru-RU')}
                  </p>
                  <button
                    onClick={() => toggleExpand(log.id)}
                    className="text-xs transition-all hover:scale-105"
                    style={{ color: "#a855f7", fontFamily: "var(--font-display)" }}
                  >
                    {expandedLog === log.id ? '▼' : '▶'}
                  </button>
                </div>
              </div>

              {/* Expandable Details */}
              {expandedLog === log.id && (
                <div className="mt-4 p-4 rounded-lg space-y-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                  {log.details && (
                    <div>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                        Подробности
                      </p>
                      <p style={{ 
                        fontFamily: "var(--font-body)", 
                        fontSize: 13, 
                        color: "#a0a0b8", 
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap"
                      }}>
                        {log.details}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {log.ipAddress && (
                      <div>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                          IP адрес
                        </p>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#a0a0b8" }}>
                          {log.ipAddress}
                        </p>
                      </div>
                    )}
                    {log.userAgent && (
                      <div>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                          User Agent
                        </p>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#a0a0b8", wordBreak: "break-all" }}>
                          {log.userAgent}
                        </p>
                      </div>
                    )}
                  </div>

                  {log.userId && (
                    <div>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                        ID пользователя
                      </p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#a0a0b8" }}>
                          {log.userId}
                        </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}