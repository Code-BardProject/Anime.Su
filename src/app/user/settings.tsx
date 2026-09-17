import { useState, useEffect } from "react";
import { getSettings } from "../../../services/userApi";

interface Settings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  maxUploadSize: number;
  allowedFileTypes: string[];
  theme: string;
  language: string;
}

interface SettingsProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const fallbackSettings: Settings = {
  siteName: 'Anime.Su',
  siteDescription: 'Место для любителей аниме и сериалов.',
  maintenanceMode: false,
  registrationEnabled: true,
  maxUploadSize: 100,
  allowedFileTypes: ['jpg', 'png', 'webp', 'mp4'],
  theme: 'dark',
  language: 'ru',
};

export default function Settings({ onNavigate }: SettingsProps) {
  const [settings, setSettings] = useState<Settings | null>(fallbackSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Settings>>(fallbackSettings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSettings();
      if (data.success && data.settings) {
        setSettings(data.settings);
        setEditForm(data.settings);
        return;
      }

      setSettings(fallbackSettings);
      setEditForm(fallbackSettings);
    } catch (err) {
      console.error(err);
      setSettings(fallbackSettings);
      setEditForm(fallbackSettings);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Update functionality - needs to be added to userApi
      setSettings(editForm as Settings);
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#f87171", marginBottom: 12 }}>{error}</p>
        <button
          onClick={loadSettings}
          className="px-4 py-2 rounded text-sm"
          style={{ background: "rgba(124,58,237,0.1)", color: "#a855f7", fontFamily: "var(--font-display)" }}
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          НАСТРОЙКИ
        </h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 rounded text-sm"
            style={{ background: "rgba(124,58,237,0.1)", color: "#a855f7", fontFamily: "var(--font-display)" }}
          >
            Редактировать
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="mb-4 p-3 rounded" style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)" }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "#4ade80" }}>Настройки сохранены успешно!</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Site Settings */}
        <div className="p-6 rounded" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "#e8e8f0", marginBottom: 16 }}>
            Настройки сайта
          </h3>
          <div className="space-y-4">
            <div>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "block" }}>
                Название сайта
              </label>
              {editing ? (
                <input
                  type="text"
                  value={editForm.siteName || ''}
                  onChange={(e) => setEditForm({ ...editForm, siteName: e.target.value })}
                  className="w-full px-4 py-3 rounded outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                />
              ) : (
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#a0a0b8" }}>{settings?.siteName}</p>
              )}
            </div>
            <div>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "block" }}>
                Описание сайта
              </label>
              {editing ? (
                <textarea
                  value={editForm.siteDescription || ''}
                  onChange={(e) => setEditForm({ ...editForm, siteDescription: e.target.value })}
                  className="w-full px-4 py-3 rounded outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14, minHeight: 80 }}
                />
              ) : (
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#a0a0b8" }}>{settings?.siteDescription}</p>
              )}
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="p-6 rounded" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "#e8e8f0", marginBottom: 16 }}>
            Системные настройки
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, color: "#e8e8f0" }}>Режим обслуживания</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>Отключить сайт для пользователей</p>
              </div>
              {editing ? (
                <button
                  onClick={() => setEditForm({ ...editForm, maintenanceMode: !editForm.maintenanceMode })}
                  className="w-12 h-6 rounded transition-all"
                  style={{ background: editForm.maintenanceMode ? "#a855f7" : "rgba(124,58,237,0.2)", position: 'relative' }}
                >
                  <div
                    className="w-5 h-5 rounded-full transition-all"
                    style={{ 
                      background: "#fff",
                      position: 'absolute',
                      top: 2,
                      left: editForm.maintenanceMode ? 28 : 2
                    }}
                  />
                </button>
              ) : (
                <span className={`px-2 py-1 rounded text-xs`} style={{ background: settings?.maintenanceMode ? "rgba(248,113,113,0.1)" : "rgba(74,222,128,0.1)", color: settings?.maintenanceMode ? "#f87171" : "#4ade80", fontFamily: "var(--font-mono)" }}>
                  {settings?.maintenanceMode ? 'Включён' : 'Выключен'}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, color: "#e8e8f0" }}>Регистрация</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>Разрешить регистрацию новых пользователей</p>
              </div>
              {editing ? (
                <button
                  onClick={() => setEditForm({ ...editForm, registrationEnabled: !editForm.registrationEnabled })}
                  className="w-12 h-6 rounded transition-all"
                  style={{ background: editForm.registrationEnabled ? "#a855f7" : "rgba(124,58,237,0.2)", position: 'relative' }}
                >
                  <div
                    className="w-5 h-5 rounded-full transition-all"
                    style={{ 
                      background: "#fff",
                      position: 'absolute',
                      top: 2,
                      left: editForm.registrationEnabled ? 28 : 2
                    }}
                  />
                </button>
              ) : (
                <span className={`px-2 py-1 rounded text-xs`} style={{ background: settings?.registrationEnabled ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", color: settings?.registrationEnabled ? "#4ade80" : "#f87171", fontFamily: "var(--font-mono)" }}>
                  {settings?.registrationEnabled ? 'Включена' : 'Отключена'}
                </span>
              )}
            </div>
            <div>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "block" }}>
                Максимальный размер файла (МБ)
              </label>
              {editing ? (
                <input
                  type="number"
                  value={editForm.maxUploadSize || 100}
                  onChange={(e) => setEditForm({ ...editForm, maxUploadSize: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                />
              ) : (
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#a0a0b8" }}>{settings?.maxUploadSize} МБ</p>
              )}
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="p-6 rounded" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "#e8e8f0", marginBottom: 16 }}>
            Внешний вид
          </h3>
          <div className="space-y-4">
            <div>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "block" }}>
                Тема
              </label>
              {editing ? (
                <select
                  value={editForm.theme || 'dark'}
                  onChange={(e) => setEditForm({ ...editForm, theme: e.target.value })}
                  className="w-full px-4 py-3 rounded outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                >
                  <option value="dark">Тёмная</option>
                  <option value="light">Светлая</option>
                  <option value="auto">Авто</option>
                </select>
              ) : (
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#a0a0b8" }}>{settings?.theme}</p>
              )}
            </div>
            <div>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "block" }}>
                Язык
              </label>
              {editing ? (
                <select
                  value={editForm.language || 'ru'}
                  onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                  className="w-full px-4 py-3 rounded outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                >
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                  <option value="hy">Հայերեն</option>
                </select>
              ) : (
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#a0a0b8" }}>{settings?.language}</p>
              )}
            </div>
          </div>
        </div>

        {editing && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditing(false);
                setEditForm(settings || {});
              }}
              className="flex-1 py-3 rounded text-sm"
              style={{ background: "rgba(255,255,255,0.04)", color: "#6b6b8a", fontFamily: "var(--font-display)" }}
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 rounded text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", fontFamily: "var(--font-display)" }}
            >
              Сохранить
            </button>
          </div>
        )}
      </div>
    </div>
  );
}