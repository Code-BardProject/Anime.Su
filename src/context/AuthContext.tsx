import { createContext, useContext, useState, ReactNode } from "react";
import { authApi } from "../../services/authApi";
import { adminApi } from "../../services/adminApi";
import { loginUser, registerUser } from "../../services/userApi";

export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
  role: "USER" | "MODERATOR" | "ADMIN";
  joinDate: string;
  isPremium: boolean;
  emailVerified: boolean;
  stats: { watching: number; completed: number; planned: number; dropped: number };
}

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string, role?: "USER" | "ADMIN") => Promise<{ ok: boolean; error?: string }>;
  register: (username: string, email: string, password: string, role?: "USER" | "ADMIN") => Promise<{ ok: boolean; error?: string }>;
  setUser: (nextUser: User | null) => void;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
  verifyAdminEmail: (code: string) => Promise<{ ok: boolean; error?: string }>;
  needsEmailVerification: () => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const toAppUser = (serverUser: Record<string, unknown>, fallbackEmail: string, fallbackRole: User["role"]): User => {
  const serverRole = String(serverUser.role || fallbackRole).toLowerCase();
  return {
    id: Number(serverUser.id || serverUser._id || 0),
    username: String(serverUser.username || fallbackEmail.split("@")[0]),
    email: String(serverUser.email || fallbackEmail),
    avatar: String(serverUser.avatar || serverUser.username || fallbackEmail || "U").charAt(0).toUpperCase(),
    role: serverRole === "admin" ? "ADMIN" : serverRole === "teacher" || serverRole === "moderator" ? "MODERATOR" : fallbackRole,
    joinDate: new Date().toLocaleDateString("ru"),
    isPremium: serverRole === "admin",
    emailVerified: Boolean(serverUser.isVerified ?? serverUser.emailVerified ?? false),
    stats: { watching: 0, completed: 0, planned: 0, dropped: 0 },
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("animeSuUser");
      return saved ? JSON.parse(saved) as User : null;
    } catch {
      return null;
    }
  });

  const persistUser = (nextUser: User | null) => {
    setUserState(nextUser);
    if (nextUser) {
      localStorage.setItem("animeSuUser", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("animeSuUser");
    }
  };

  const login = async (email: string, password: string, role: "USER" | "ADMIN" = "USER") => {
    if (role === "ADMIN") {
      // Use adminApi for admin login
      const adminRes = await adminApi.loginAdmin({ email, password });
      if (adminRes.success) {
        const serverUser = adminRes.data?.user;
        if (serverUser) {
          const user: User = {
            id: Number(serverUser.id ?? Date.now()),
            username: serverUser.username || email.split("@")[0],
            email: serverUser.email || email,
            avatar: (serverUser.avatar || serverUser.username || email[0] || "A").toString().charAt(0).toUpperCase(),
            role: "ADMIN",
            joinDate: new Date().toLocaleDateString("ru"),
            isPremium: true,
            emailVerified: serverUser.emailVerified ?? false,
            stats: { watching: 0, completed: 0, planned: 0, dropped: 0 },
          };
          persistUser(user);
          return { ok: true };
        }
      }
      return { ok: false, error: adminRes.error || "Ошибка входа администратора" };
    }
    
    const userRes = await loginUser({ email, password });
    if (!userRes.success || !userRes.data?.user) {
      return { ok: false, error: userRes.error || "Неверный email или пароль" };
    }
    persistUser(toAppUser(userRes.data.user, email, "USER"));
    return { ok: true };
  };

  const register = async (username: string, email: string, password: string, role: "USER" | "ADMIN" = "USER") => {
    if (role === "ADMIN") {
      return { ok: false, error: "Регистрация администратора доступна только в админ-панели" };
    }
    
    const userRes = await registerUser({ username, email, password });
    if (!userRes.success || !userRes.data?.user) {
      return { ok: false, error: userRes.error || "Ошибка регистрации пользователя" };
    }
    persistUser(toAppUser(userRes.data.user, email, "USER"));
    return { ok: true };
  };

  const verifyAdminEmail = async (code: string) => {
    if (!user || user.role !== "ADMIN") {
      return { ok: false, error: "Только администраторы могут использовать эту функцию" };
    }
    
    const result = await adminApi.verifyEmail(user.email, code);
    if (!result.success) return { ok: false, error: result.error || "Неверный код верификации" };
    persistUser({ ...user, emailVerified: true });
    return { ok: true };
  };

  const needsEmailVerification = () => {
    return user !== null && user.role === "ADMIN" && !user.emailVerified;
  };

  const logout = () => {
    authApi.clearToken();
    localStorage.removeItem("animeSuAuthToken");
    persistUser(null);
  };
  const updateUser = (partial: Partial<User>) => {
    setUserState(prev => {
      const next = prev ? { ...prev, ...partial } : prev;
      if (next) {
        localStorage.setItem("animeSuUser", JSON.stringify(next));
      }
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, setUser: persistUser, logout, updateUser, verifyAdminEmail, needsEmailVerification }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
