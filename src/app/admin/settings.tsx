import { useState, useEffect } from "react";
import { useLanguage } from "../../i18n/in8n";
import { adminApi } from "../../../services/adminApi";

interface AdminSettings {
  id: string;
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  maxUploadSize: number;
  allowedFileTypes: string[];
  theme: 'dark' | 'light' | 'auto';
  language: string;
}

interface SettingsProps {
  onNavigate: (page: string, data?: unknown) => void;
}

export default function Settings({ onNavigate }: SettingsProps) {
  const { setLanguage } = useLanguage();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getSettings();
      if (data.success && data.settings) {
        setSettings({
          id: String((data.settings as any).id || 'default'),
          siteName: String((data.settings as any).siteName || 'AnimeSu'),
          siteDescription: String((data.settings as any).siteDescription || 'Anime streaming portal'),
          maintenanceMode: Boolean((data.settings as any).maintenanceMode),
          registrationEnabled: Boolean((data.settings as any).registrationEnabled ?? true),
          maxUploadSize: Number((data.settings as any).maxUploadSize || 100),
          allowedFileTypes: Array.isArray((data.settings as any).allowedFileTypes) ? (data.settings as any).allowedFileTypes : ['mp4', 'mkv', 'avi'],
          theme: ((data.settings as any).theme as 'dark' | 'light' | 'auto') || 'dark',
          language: String((data.settings as any).language || 'ru'),
        });
      } else {
        console.warn('Settings load failed:', data.error || 'Failed to load');
        setSettings(defaultSettings);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const defaultSettings: AdminSettings = {
    id: 'default',
    siteName: 'AnimeSu',
    siteDescription: 'Anime streaming portal',
    maintenanceMode: false,
    registrationEnabled: true,
    maxUploadSize: 100,
    allowedFileTypes: ['mp4', 'mkv', 'avi'],
    theme: 'dark',
    language: 'ru',
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      const result = await adminApi.updateSettings({
        siteName: settings.siteName,
        siteDescription: settings.siteDescription,
        maintenanceMode: settings.maintenanceMode,
        registrationEnabled: settings.registrationEnabled,
        maxUploadSize: settings.maxUploadSize,
        allowedFileTypes: settings.allowedFileTypes,
        theme: settings.theme,
        language: settings.language,
      });
      if (!result.success) {
        throw new Error(result.error || 'Failed to save settings');
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof AdminSettings, value: any) => {
    if (settings) {
      const next = { ...settings, [field]: value };
      setSettings(next);
      if (field === 'language') {
        setLanguage(String(value || 'ru'));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b6b8a" }}>Загрузка...</p>
        </div>
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

  if (!settings) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            НАСТРОЙКИ
          </h2>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a", marginTop: 4 }}>
            Сайт · {settings.siteName || 'AnimeSu'}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 rounded text-sm font-semibold disabled:opacity-50"
          style={{ 
            background: saving ? "rgba(124,58,237,0.5)" : "linear-gradient(135deg, #7c3aed, #a855f7)", 
            color: "#fff", 
            fontFamily: "var(--font-display)" 
          }}
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>

      {success && (
        <div className="mb-6 p-4 rounded" style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#4ade80" }}>
            Настройки успешно сохранены
          </p>
        </div>
      )}

      <div className="space-y-6">
        <div className="rounded p-6" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
            Общие настройки
          </h3>
          <div className="space-y-4">
            <div>
              <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                Название сайта
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => handleChange('siteName', e.target.value)}
                className="w-full px-4 py-3 rounded outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                Описание сайта
              </label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => handleChange('siteDescription', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
              />
            </div>
          </div>
        </div>

        <div className="rounded p-6" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
            Системные настройки
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "#e8e8f0", fontWeight: 600 }}>Режим обслуживания</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>Отключить доступ для пользователей</p>
              </div>
              <button
                onClick={() => handleChange('maintenanceMode', !settings.maintenanceMode)}
                className={`w-12 h-6 rounded-full transition-all ${settings.maintenanceMode ? 'bg-purple-500' : 'bg-gray-600'}`}
                style={{ position: 'relative' }}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-all ${settings.maintenanceMode ? 'translate-x-7' : 'translate-x-1'}`}
                  style={{ marginTop: 4 }}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "#e8e8f0", fontWeight: 600 }}>Регистрация</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b6b8a" }}>Разрешить новым пользователям регистрироваться</p>
              </div>
              <button
                onClick={() => handleChange('registrationEnabled', !settings.registrationEnabled)}
                className={`w-12 h-6 rounded-full transition-all ${settings.registrationEnabled ? 'bg-purple-500' : 'bg-gray-600'}`}
                style={{ position: 'relative' }}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-all ${settings.registrationEnabled ? 'translate-x-7' : 'translate-x-1'}`}
                  style={{ marginTop: 4 }}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="rounded p-6" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
            Настройки загрузки
          </h3>
          <div className="space-y-4">
            <div>
              <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                Максимальный размер файла (МБ)
              </label>
              <input
                type="number"
                value={settings.maxUploadSize}
                onChange={(e) => handleChange('maxUploadSize', parseInt(e.target.value))}
                className="w-full px-4 py-3 rounded outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                Разрешённые типы файлов (через запятую)
              </label>
              <input
                type="text"
                value={settings.allowedFileTypes.join(', ')}
                onChange={(e) => handleChange('allowedFileTypes', e.target.value.split(',').map(s => s.trim()))}
                className="w-full px-4 py-3 rounded outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
                placeholder=".jpg, .png, .mp4"
              />
            </div>
          </div>
        </div>

        <div className="rounded p-6" style={{ background: "var(--card)", border: "1px solid rgba(124,58,237,0.12)" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#e8e8f0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
            Внешний вид
          </h3>
          <div className="space-y-4">
            <div>
              <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                Тема
              </label>
              <select
                value={settings.theme}
                onChange={(e) => handleChange('theme', e.target.value as 'dark' | 'light' | 'auto')}
                className="w-full px-4 py-3 rounded outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
              >
                <option value="dark">Тёмная</option>
                <option value="light">Светлая</option>
                <option value="auto">Авто</option>
              </select>
            </div>
            <div>
              <label style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "#6b6b8a", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                Язык
              </label>
              <select
                value={settings.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="w-full px-4 py-3 rounded outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)", color: "#e8e8f0", fontFamily: "var(--font-body)", fontSize: 14 }}
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
                <option value="hy">Հայերեն</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
