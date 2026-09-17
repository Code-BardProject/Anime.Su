import { useState, useEffect } from "react";
import { useLanguage } from "../../i18n/in8n";
import { adminApi } from "../../../services/adminApi";
import AdminForgotPassword from "./forgotyourpassword";
import { useAuth, type User } from "../../context/AuthContext";
import GoogleAuth from "../auth/googleAuth";
import DiscordAuth from "../auth/discord";
import VKAuth from "../auth/vk";

const adminCountries = [
  { code: "RU", name: "Россия", dial: "+7" },
  { code: "UA", name: "Украина", dial: "+380" },
  { code: "KZ", name: "Казахстан", dial: "+7" },
  { code: "BY", name: "Беларусь", dial: "+375" },
  { code: "AM", name: "Армения", dial: "+374" },
  { code: "GE", name: "Грузия", dial: "+995" },
  { code: "DE", name: "Германия", dial: "+49" },
  { code: "US", name: "США", dial: "+1" },
  { code: "OTHER", name: "Другая страна", dial: "+" },
];

// Helper function to safely access nested properties
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

interface AdminLayoutProps {
  onNavigate: (page: string) => void;
}

export default function AdminLayout({ onNavigate }: AdminLayoutProps) {
  const { t } = useLanguage();
  const { setUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [backgroundType, setBackgroundType] = useState<'photo' | 'video' | 'none'>('none');
  const [backgroundMedia, setBackgroundMedia] = useState<string>('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: '',
    phone: '',
    country: 'RU',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const passwordLength = formData.password.length;
  const passwordStrength = passwordLength < 6
    ? { label: 'Слабый пароль', color: '#f87171', width: `${Math.min(passwordLength / 8, 1) * 100}%` }
    : passwordLength < 8
      ? { label: 'Средний пароль', color: '#fb923c', width: `${(passwordLength / 8) * 100}%` }
      : { label: 'Надёжный пароль', color: '#4ade80', width: '100%' };
  const confirmPasswordMatches = formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;

  if (showForgotPassword) {
    return (
      <AdminForgotPassword
        onSuccess={() => setShowForgotPassword(false)}
        onSwitchTo={() => setShowForgotPassword(false)}
      />
    );
  }

  const handleBackgroundUpload = (type: 'photo' | 'video') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'photo' ? 'image/*' : 'video/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setBackgroundMedia(url);
        setBackgroundType(type);
      }
    };
    input.click();
  };

  const handleRemoveBackground = () => {
    setBackgroundType('none');
    setBackgroundMedia('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    // Validation
    const newErrors: Record<string, string> = {};
    const normalizedEmail = formData.email.trim().toLowerCase();
    const normalizedUsername = formData.username.trim();
    if (!normalizedEmail) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!isLogin && !formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!isLogin && !formData.country) newErrors.country = 'Country is required';
    if (!isLogin && formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!isLogin && !normalizedUsername) newErrors.username = 'Username is required';
    if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      let result;
      
      if (isLogin) {
        // Use adminApi for admin login
        const adminRes = await adminApi.loginAdmin({ 
          email: formData.email, 
          password: formData.password 
        });
        
        if (adminRes.success) {
          result = { ok: true, data: adminRes.data };
        } else {
          result = { ok: false, error: adminRes.error };
        }
      } else {
        // Use adminApi for admin registration
        const adminRes = await adminApi.registerAdmin({ 
          username: normalizedUsername,
          email: normalizedEmail,
          password: formData.password,
          phone: formData.phone.trim(),
          country: formData.country,
        });
        
        if (adminRes.success) {
          result = { ok: true, data: adminRes.data };
        } else {
          result = { ok: false, error: adminRes.error };
        }
      }
      
      if (!result.ok) {
        setErrors({ general: result.error || (isLogin ? "Ошибка входа" : "Ошибка регистрации") });
        return;
      }

      const serverUser = result.data?.user;
      const serverRole = String(serverUser?.role || "").toLowerCase();
      if (!serverUser || !["admin", "moderator", "teacher"].includes(serverRole)) {
        setErrors({ general: "Недостаточно прав для входа в панель администратора" });
        return;
      }

      const nextUser: User = {
        id: Number(serverUser.id ?? Date.now()),
        username: serverUser.username || formData.username || formData.email.split("@")[0],
        email: serverUser.email || formData.email,
        avatar: (serverUser.avatar || serverUser.username || formData.username || formData.email[0] || "A").toString().charAt(0).toUpperCase(),
        role: serverRole === "admin" ? "ADMIN" : "MODERATOR",
        joinDate: new Date().toLocaleDateString("ru"),
        isPremium: true,
        emailVerified: serverUser.emailVerified ?? !isLogin,
        stats: { watching: 0, completed: 0, planned: 0, dropped: 0 },
      };
      setUser(nextUser);
      setLoading(false);
      onNavigate(isLogin && nextUser.emailVerified ? 'admin' : 'admin-email-verification');
    } catch {
      setErrors({ general: "Не удалось подключиться к серверу. Проверьте соединение и повторите попытку." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      {backgroundType === 'photo' && backgroundMedia && (
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${backgroundMedia})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.3)'
          }}
        />
      )}
      {backgroundType === 'video' && backgroundMedia && (
        <video 
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{ filter: 'brightness(0.3)' }}
          autoPlay 
          loop 
          muted 
          playsInline
        >
          <source src={backgroundMedia} type="video/mp4" />
        </video>
      )}
      {backgroundType === 'none' && (
        <div 
          className="absolute inset-0 z-0"
          style={{
            background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(124,58,237,0.15) 0%, transparent 70%)',
            backgroundColor: 'var(--background)'
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
          
          {/* Left side - Instructions */}
          <div className="rounded-xl p-8 backdrop-blur-sm" style={{
            background: 'rgba(19,19,28,0.8)',
            border: '1px solid rgba(124,58,237,0.2)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)'
          }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)'
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 20,
                  color: '#fff'
                }}>A</span>
              </div>
              <div>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 24,
                  color: '#e8e8f0',
                  letterSpacing: '0.08em'
                }}>
                  {t.admin.title}
                </h2>
                <p style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: '#6b6b8a',
                  letterSpacing: '0.1em'
                }}>
                  ACCESS CONTROL +++++
                </p>
              </div>
            </div>

            {/* Background Controls */}
            <div className="mb-6 p-4 rounded" style={{
              background: 'rgba(124,58,237,0.06)',
              border: '1px solid rgba(124,58,237,0.15)'
            }}>
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: '#6b6b8a',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 12
              }}>
                {t.common.language}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBackgroundUpload('photo')}
                  className="flex-1 py-2 rounded text-xs transition-all"
                  style={{
                    background: 'rgba(124,58,237,0.1)',
                    border: '1px solid rgba(124,58,237,0.3)',
                    color: '#a855f7',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.04em'
                  }}
                >
                  {t.admin.uploadPhoto}
                </button>
                <button
                  onClick={() => handleBackgroundUpload('video')}
                  className="flex-1 py-2 rounded text-xs transition-all"
                  style={{
                    background: 'rgba(124,58,237,0.1)',
                    border: '1px solid rgba(124,58,237,0.3)',
                    color: '#a855f7',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.04em'
                  }}
                >
                  {t.admin.uploadVideo}
                </button>
                {backgroundType !== 'none' && (
                  <button
                    onClick={handleRemoveBackground}
                    className="px-3 py-2 rounded text-xs transition-all"
                    style={{
                      background: 'rgba(248,113,113,0.1)',
                      border: '1px solid rgba(248,113,113,0.3)',
                      color: '#f87171',
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '0.04em'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-6">
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 14,
                color: '#e8e8f0',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 12
              }}>
                {getNestedValue(t, 'admin.instructions') || 'Administrator Instructions'}
              </h3>
              <div className="space-y-2">
                {(getNestedValue(t, 'admin.rulesList') || []).map((rule: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{
                      background: '#a855f7'
                    }} />
                    <p style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 12,
                      color: '#a0a0b8',
                      lineHeight: 1.5
                    }}>
                      {rule}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Rules */}
            <div>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 14,
                color: '#e8e8f0',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 12
              }}>
                {getNestedValue(t, 'admin.rules') || 'Admin Rules'}
              </h3>
              <div className="p-3 rounded" style={{
                background: 'rgba(248,113,113,0.06)',
                border: '1px solid rgba(248,113,113,0.15)'
              }}>
                <p style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: '#f87171',
                  lineHeight: 1.6
                }}>
                  ⚠️ Admin access is restricted to authorized personnel only. 
                  All actions are logged and monitored. 
                  Misuse of admin privileges will result in immediate termination.
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Auth Form */}
          <div className="rounded-xl p-8 backdrop-blur-sm" style={{
            background: 'rgba(19,19,28,0.9)',
            border: '1px solid rgba(124,58,237,0.2)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)'
          }}>
            <div className="flex items-center justify-between mb-6">
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 20,
                color: '#e8e8f0',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}>
                {isLogin ? t.admin.login : t.admin.register}
              </h2>
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="px-3 py-1.5 rounded text-xs transition-all"
                style={{
                  background: 'rgba(124,58,237,0.1)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  color: '#a855f7',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.04em'
                }}
              >
                {isLogin ? t.auth.register : t.auth.login}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 11,
                    color: '#6b6b8a',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                    display: 'block'
                  }}>
                    {t.auth.username}
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-4 py-3 rounded outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: errors.username ? '1px solid rgba(248,113,113,0.5)' : '1px solid rgba(124,58,237,0.25)',
                      color: '#e8e8f0',
                      fontFamily: 'var(--font-body)',
                      fontSize: 14
                    }}
                    placeholder="AdminUsername"
                  />
                  {errors.username && (
                    <p style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 11,
                      color: '#f87171',
                      marginTop: 4
                    }}>{errors.username}</p>
                  )}
                </div>
              )}

              {!isLogin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: '#6b6b8a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                      Страна
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-4 py-3 rounded outline-none"
                      style={{ background: '#171722', border: errors.country ? '1px solid #f87171' : '1px solid rgba(124,58,237,0.25)', color: '#e8e8f0', fontFamily: 'var(--font-body)', fontSize: 14 }}
                    >
                      {adminCountries.map((country) => <option key={country.code} value={country.code}>{country.name} ({country.dial})</option>)}
                    </select>
                    {errors.country && <p style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>{errors.country}</p>}
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: '#6b6b8a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                      Номер телефона
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9+()\s-]/g, '') })}
                      className="w-full px-4 py-3 rounded outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: errors.phone ? '1px solid #f87171' : '1px solid rgba(124,58,237,0.25)', color: '#e8e8f0', fontFamily: 'var(--font-body)', fontSize: 14 }}
                      placeholder="+7 900 000-00-00"
                    />
                    {errors.phone && <p style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>{errors.phone}</p>}
                  </div>
                </div>
              )}

              <div>
                <label style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  color: '#6b6b8a',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                  display: 'block'
                }}>
                  {t.auth.email}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 rounded outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: errors.email ? '1px solid rgba(248,113,113,0.5)' : '1px solid rgba(124,58,237,0.25)',
                    color: '#e8e8f0',
                    fontFamily: 'var(--font-body)',
                    fontSize: 14
                  }}
                  placeholder="admin@animedia.ru"
                />
                {errors.email && (
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 11,
                    color: '#f87171',
                    marginTop: 4
                  }}>{errors.email}</p>
                )}
              </div>

              <div>
                <label style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  color: '#6b6b8a',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                  display: 'block'
                }}>
                  {t.auth.password}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 rounded outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: errors.password ? '1px solid rgba(248,113,113,0.5)' : '1px solid rgba(124,58,237,0.25)',
                    color: '#e8e8f0',
                    fontFamily: 'var(--font-body)',
                    fontSize: 14
                  }}
                  placeholder="••••••••"
                />
                {!isLogin && (
                  <div className="mt-2" aria-live="polite">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: passwordStrength.width, background: passwordStrength.color }} />
                    </div>
                    <div className="flex justify-between mt-1" style={{ fontSize: 11, color: passwordStrength.color }}>
                      <span>{passwordStrength.label}</span>
                      <span>{passwordLength}/8</span>
                    </div>
                    <p style={{ color: '#6b6b8a', fontSize: 11, marginTop: 3 }}>Минимум 8 символов. Разрешены буквы, цифры и специальные знаки.</p>
                  </div>
                )}
                {isLogin && (
                  <div className="mt-2" aria-live="polite">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(passwordLength / 8, 1) * 100}%`, background: passwordStrength.color }} />
                    </div>
                    <div className="flex justify-between mt-1" style={{ fontSize: 11, color: passwordStrength.color }}><span>{passwordStrength.label}</span><span>{passwordLength}/8</span></div>
                  </div>
                )}
                {errors.password && (
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 11,
                    color: '#f87171',
                    marginTop: 4
                  }}>{errors.password}</p>
                )}
              </div>

              {!isLogin && (
                <div>
                  <label style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 11,
                    color: '#6b6b8a',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                    display: 'block'
                  }}>
                    {t.auth.confirmPassword}
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="w-full px-4 py-3 rounded outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: errors.confirmPassword ? '1px solid rgba(248,113,113,0.5)' : '1px solid rgba(124,58,237,0.25)',
                      color: '#e8e8f0',
                      fontFamily: 'var(--font-body)',
                      fontSize: 14
                    }}
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && (
                    <p style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 11,
                      color: '#f87171',
                      marginTop: 4
                    }}>{errors.confirmPassword}</p>
                  )}
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: formData.confirmPassword ? '100%' : '0%', background: confirmPasswordMatches ? '#4ade80' : '#f87171' }} />
                  </div>
                  {formData.confirmPassword && <p style={{ color: confirmPasswordMatches ? '#4ade80' : '#f87171', fontSize: 11, marginTop: 4 }}>{confirmPasswordMatches ? 'Пароли совпадают' : 'Пароли не совпадают'}</p>}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded font-semibold transition-all mt-4 hover:shadow-lg disabled:opacity-50"
                style={{
                  background: loading ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  color: '#fff',
                  fontFamily: 'var(--font-display)',
                  fontSize: 15,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(124,58,237,0.4)'
                }}
              >
                {loading ? '...' : (isLogin ? t.auth.login : t.auth.register)}
              </button>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="w-full mt-3"
                  style={{ background: 'transparent', border: 0, color: '#a855f7', fontFamily: 'var(--font-body)', fontSize: 13 }}
                >
                  Забыли пароль?
                </button>
              )}
            </form>

            {/* OAuth Section */}
            <div className="mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: '#6b6b8a'
                }}>
                  {t.admin.oauth}
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>
              <div className="flex gap-3">
                <VKAuth />
                <GoogleAuth />
                <DiscordAuth />
              </div>
            </div>

            {/* Back button */}
            <button
              onClick={() => onNavigate('home')}
              className="w-full mt-6 py-2 rounded text-xs transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#6b6b8a',
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.06em'
              }}
            >
              ← {t.nav.home}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}