# Anime.Su - Backend Integration Guide

## 📋 Overview

Frontend приложение Anime.Su подключено к backend API через сервис `services/userApi.ts`.

**Backend путь:** `C:\Users\admin\Desktop\animesu-backend\`
**Frontend путь:** `C:\Users\admin\Desktop\Создание приложения — копия\`

---

## 🔗 API Configuration

### Environment Variables (.env.local)

```env
VITE_API_URL=http://localhost:5003/api
VITE_APP_NAME=Anime.Su
VITE_ENVIRONMENT=development
```

Backend слушает на порту **5003** (указано в `.env` backend'a)

---

## 📡 API Endpoints

### Authentication

| Метод | Endpoint | Описание |
|-------|----------|---------|
| POST | `/auth/register` | Регистрация нового пользователя |
| POST | `/auth/login` | Вход пользователя |
| POST | `/auth/verify-email` | Верификация email с 6-значным кодом |
| POST | `/auth/resend-verification` | Переотправка кода верификации |
| POST | `/auth/forgot-password` | Запрос восстановления пароля |
| POST | `/auth/reset-password` | Восстановление пароля с кодом |
| POST | `/auth/refresh` | Обновление JWT токена |

### User Profile

| Метод | Endpoint | Описание | Auth |
|-------|----------|---------|------|
| GET | `/users/profile` | Получить профиль | ✓ |
| PUT | `/users/profile` | Обновить профиль | ✓ |
| POST | `/users/avatar` | Загрузить аватар | ✓ |
| POST | `/users/change-password` | Изменить пароль | ✓ |
| PUT | `/users/notifications` | Обновить настройки уведомлений | ✓ |

---

## 🚀 Компоненты аутентификации

### 1. **Login** (`src/app/auth/login.tsx`)
```typescript
import { loginUser } from "../../services/userApi";

const res = await loginUser({ 
  email: "user@example.com", 
  password: "password123" 
});
```

**Что происходит:**
- Отправляет `POST /auth/login` на backend
- Backend сравнивает с БД
- Возвращает JWT токен
- Токен сохраняется в localStorage

---

### 2. **Registration** (`src/app/auth/registrtatia.tsx`)
```typescript
import { registerUser } from "../../services/userApi";

const res = await registerUser({ 
  username: "username",
  email: "user@example.com", 
  password: "password123" 
});
```

**Что происходит:**
- Отправляет `POST /auth/register` на backend
- Backend создает документ User в MongoDB
- **Nodemailer отправляет письмо** с 6-значным кодом
- Frontend переводит пользователя на EmailVerification

---

### 3. **Email Verification** (`src/app/auth/vereficationemail.tsx`)
```typescript
import { verifyEmail, resendVerificationEmail } from "../../services/userApi";

const res = await verifyEmail({ 
  email: "user@example.com", 
  code: "123456" 
});
```

**Что происходит:**
- Пользователь вводит 6-значный код из письма
- Отправляет `POST /auth/verify-email`
- Backend проверяет код в БД
- Если верно → пользователь активирован ✓
- Таймер позволяет переотправить код через 60 сек

---

### 4. **Forgot Password** (`src/app/auth/forgotyourpassword.tsx`)
```typescript
import { requestPasswordReset, resetPassword } from "../../services/userApi";

// Шаг 1: Отправить email
await requestPasswordReset("user@example.com");
// Backend: Nodemailer отправляет код на email

// Шаг 2: Восстановить пароль
await resetPassword({ 
  email: "user@example.com", 
  code: "reset-code", 
  newPassword: "newpass123" 
});
```

---

## 💾 User Profile Data

### Данные профиля, передаваемые в БД

```typescript
interface UserProfileData {
  firstName?: string;        // Имя
  lastName?: string;         // Фамилия
  email: string;            // Email (обязательно)
  username?: string;        // Никнейм
  avatar?: string;          // URL аватара
  bio?: string;             // Биография
  theme?: "light" | "dark"; // Тема
  language?: string;        // Язык (ru, en, etc)
  notifications?: {         // Настройки уведомлений
    email: boolean;
    push: boolean;
    newsletter: boolean;
  };
  privacy?: {               // Настройки приватности
    isPublic: boolean;
    showActivity: boolean;
  };
}
```

### Обновление профиля

```typescript
import { updateUserProfile } from "../../services/userApi";

const res = await updateUserProfile({
  firstName: "Иван",
  lastName: "Петров",
  bio: "Любитель аниме",
  theme: "dark",
  language: "ru"
});
```

**Backend:**
- Проверяет JWT токен
- Обновляет документ в MongoDB
- Возвращает обновленный профиль

---

## 🔐 Authentication Flow

```
┌─────────────────────┐
│  1. REGISTRATION    │
│  (registrtatia.tsx) │
└──────────┬──────────┘
           │ registerUser()
           ▼
    ┌────────────────┐
    │ Backend API    │
    │ /auth/register │─── Nodemailer ────► Email with 6-digit code
    └────────┬───────┘
             │ Returns: user data
             ▼
┌──────────────────────────┐
│ 2. EMAIL VERIFICATION    │
│ (vereficationemail.tsx)  │
└──────────┬───────────────┘
           │ verifyEmail(email, code)
           ▼
    ┌──────────────────────┐
    │ Backend API          │
    │ /auth/verify-email   │─── Update user.isVerified = true
    └────────┬─────────────┘
             │ Returns: { ok: true }
             ▼
    ┌──────────────────┐
    │ onSuccess()      │
    │ → Redirect Home  │
    └──────────────────┘
```

---

## 🛡️ Token Management

### Хранение токенов

```typescript
// После успешного входа
localStorage.setItem("authToken", token);        // Access token
localStorage.setItem("refreshToken", refreshToken); // Refresh token
```

### Использование в запросах

```typescript
// Все защищенные запросы используют:
const token = localStorage.getItem("authToken");
headers: {
  "Authorization": `Bearer ${token}`
}
```

### Обновление токена

```typescript
import { refreshAuthToken } from "../../services/userApi";

// Автоматически вызывается при истечении access token
const res = await refreshAuthToken();
if (!res.ok) {
  // Session expired - redirect to login
}
```

---

## 📝 Backend Requirements

### MongoDB Collections

```javascript
// User Schema (MongoDB)
{
  _id: ObjectId,
  username: String,
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  avatar: String,
  bio: String,
  theme: String,
  language: String,
  isVerified: Boolean,
  verificationCode: String,
  verificationCodeExpires: Date,
  notifications: {
    email: Boolean,
    push: Boolean,
    newsletter: Boolean
  },
  privacy: {
    isPublic: Boolean,
    showActivity: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Environment Variables (animesu-backend/.env)

```env
PORT=5003
MONGODB_USERNAME=tarukian71_db_user
MONGODB_PASSWORD=KLzxA7QWxQB2jPPp
MONGODB_URI=mongodb+srv://tarukian71_db_user:...@animesu.ovxzst1.mongodb.net/

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tarukian71@gmail.com
SMTP_PASS=frxt eslt oyfr ijwl
SMTP_FROM=Animesu <tarukian71@gmail.com>

AUTH_SALT=animesu-demo-salt
```

---

## ✅ Проверка подключения

### 1. Запустить Backend

```bash
cd C:\Users\admin\Desktop\animesu-backend
npm install  # или yarn install
npm start    # Должен слушать на port 5003
```

### 2. Запустить Frontend

```bash
cd C:\Users\admin\Desktop\Создание\ приложения\ —\ копия
npm install  # или pnpm install
npm run dev  # Vite dev server
```

### 3. Тест регистрации

- Откройте http://localhost:5173 (или другой порт)
- Кликните "Регистрация"
- Заполните форму
- Проверьте email на кодекс (или смотрите логи backend)
- Введите код верификации
- После успеха → Профиль должен быть активирован

### 4. Проверить логи

**Backend логи:**
```bash
# Если используется morgan/winston в backend
# Смотрите логи подключения, регистрации, отправки email
```

**Frontend логи:**
```javascript
// Откройте DevTools (F12) → Console
// Смотрите запросы в Network tab
```

---

## 🐛 Troubleshooting

### CORS ошибка

**Решение:** Backend должен иметь CORS настройки:
```javascript
const cors = require('cors');
app.use(cors());  // или специфичные origins
```

### Email не приходит

1. Проверьте SMTP settings в `.env`
2. Включена ли 2FA в Gmail (если используется)
3. Смотрите логи backend'a

### Токен не сохраняется

Проверьте localStorage:
```javascript
console.log(localStorage.getItem("authToken"));
```

---

## 📚 Дополнительно

- **API документация:** Находится в backend `README.md` или API docs
- **Tестирование API:** Используйте Postman/Insomnia с примерами из `userApi.ts`
- **Секьюрность:** Все пароли хешируются (bcrypt), токены подписаны (JWT)
