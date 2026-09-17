# Frontend - Backend Integration Guide

## Архитектура потока данных

```
User Input → Component → AuthAPI/AdminAPI → Database Service → Backend
                ↓
             Encryption Service
                ↓
            SessionStorage (Reset tokens)
```

## Services Overview

### 1. encryptionService.ts
Отвечает за шифрование/дешифрование всех чувствительных данных.

**Основные методы:**
```typescript
encryptionService.encrypt(data: string): string
// Шифрует строку с временной меткой

encryptionService.decrypt(encrypted: string): string
// Дешифрует строку и проверяет TTL (15 минут)

encryptionService.hashPassword(password: string): string
// Хеширует пароль для сохранения

encryptionService.verifyPassword(password: string, hash: string): boolean
// Проверяет пароль против хеша

encryptionService.generateResetToken(): string
// Генерирует случайный токен восстановления

encryptionService.encryptForTransport(data: object): string
// Шифрует объект JSON для отправки на сервер

encryptionService.decryptFromTransport(encrypted: string): object
// Дешифрует объект JSON с сервера
```

**Использование:**
```typescript
import { encryptionService } from '@/services/encryption';

// Шифрование email
const encrypted = encryptionService.encrypt('user@example.com');

// Хеширование пароля
const hash = encryptionService.hashPassword('MyPassword123!');

// Генерация токена восстановления
const resetToken = encryptionService.generateResetToken();
```

### 2. authApi.ts
Обработка всех операций аутентификации и восстановления пароля.

**Основные методы:**
```typescript
authApi.forgotPassword(email: string): Promise<PasswordResetResponse>
// Запрашивает код восстановления для email
// Автоматически шифрует email
// Сохраняет состояние в sessionStorage

authApi.verifyResetCode(email: string, code: string): Promise<PasswordVerifyResponse>
// Проверяет код восстановления
// Шифрует email и код
// Сохраняет resetToken в sessionStorage

authApi.resetPassword(newPassword: string, confirmPassword: string): Promise<PasswordResetResponse>
// Завершает процесс восстановления пароля
// Шифрует пароль
// Использует resetToken из sessionStorage
// Очищает токены после успеха

authApi.hasActiveResetToken(): boolean
// Проверяет наличие активного токена восстановления

authApi.clearResetTokens(): void
// Очищает все токены восстановления из sessionStorage
```

**Использование:**
```typescript
import { authApi } from '@/services';

// Запросить код восстановления
const result = await authApi.forgotPassword('user@example.com');
if (result.success) {
  console.log('Код отправлен на email');
}

// Проверить код
const verify = await authApi.verifyResetCode(
  'user@example.com',
  '123456'
);
if (verify.success) {
  console.log('Код верифицирован, готовы к сбросу пароля');
}

// Сбросить пароль
const reset = await authApi.resetPassword(
  'NewPassword123!',
  'NewPassword123!'
);
if (reset.success) {
  console.log('Пароль успешно изменён');
}
```

### 3. adminApi.ts
API функции для администраторов управления системой восстановления пароля.

**Основные методы:**
```typescript
adminApi.getPasswordResetRequests(status?: string): Promise<AdminResponse>
// Получить все запросы на восстановление пароля
// Опционально: фильтр по статусу (pending|verified|completed|expired)

adminApi.verifyPasswordReset(resetId: string): Promise<AdminResponse>
// Администратор вручную подтверждает запрос на восстановление

adminApi.rejectPasswordReset(resetId: string, reason: string): Promise<AdminResponse>
// Администратор отклоняет запрос (зашифрованная причина)

adminApi.resetUserPassword(userId: string, temporaryPassword: string): Promise<AdminResponse>
// Администратор устанавливает временный пароль для пользователя

adminApi.getSecurityAuditLog(options?: object): Promise<AdminResponse>
// Получить журнал всех операций безопасности

adminApi.getFailedLoginAttempts(options?: object): Promise<AdminResponse>
// Получить попытки неудачного входа

adminApi.sendPasswordResetEmail(userId: string): Promise<AdminResponse>
// Администратор вручную отправляет письмо восстановления
```

**Использование:**
```typescript
import { adminApi } from '@/services';

// Получить все запросы на восстановление
const requests = await adminApi.getPasswordResetRequests('pending');
if (requests.success) {
  console.log(requests.data); // Массив запросов
}

// Подтвердить запрос администратора
const verify = await adminApi.verifyPasswordReset(resetId);

// Получить журнал безопасности
const logs = await adminApi.getSecurityAuditLog({
  startDate: '2026-01-01',
  endDate: '2026-12-31'
});
```

### 4. database.ts
Работа с базой данных через API.

**Основные методы:**
```typescript
database.createPasswordReset(email: string): Promise<DatabaseResponse>
// Создает запрос на восстановление пароля в БД
// Шифрует email

database.verifyPasswordResetCode(email: string, code: string): Promise<DatabaseResponse>
// Проверяет код в БД
// Шифрует email и код

database.completePasswordReset(email: string, newPassword: string): Promise<DatabaseResponse>
// Завершает восстановление пароля в БД
// Шифрует email и пароль

database.getPasswordResetHistory(): Promise<DatabaseResponse>
// Получит историю восстановления пароля текущего пользователя

database.logSecurityEvent(eventType: string, details: object): Promise<DatabaseResponse>
// Логирует событие безопасности в БД

database.encryptSensitiveData(data: object): string
// Шифрует объект для безопасной передачи

database.decryptSensitiveData(encrypted: string): object
// Дешифрует объект с сервера
```

**Использование:**
```typescript
import { database } from '@/services';

// Создать запрос восстановления
const reset = await database.createPasswordReset('user@example.com');

// Логировать событие
await database.logSecurityEvent('PASSWORD_RESET_ATTEMPTED', {
  email: 'user@example.com',
  success: true,
  timestamp: new Date()
});

// Шифровать данные для передачи
const encrypted = database.encryptSensitiveData({
  userId: 123,
  action: 'password_reset'
});
```

## Component Integration

### ForgotPassword Component
**Функция:** Первый шаг восстановления пароля - ввод email

```typescript
<ForgotPassword 
  onSuccess={(email) => {
    // Перейти на следующий шаг (ввод кода)
    onSwitchTo('reset-password');
  }}
  onSwitchTo={(mode) => {
    // Переключаться между режимами (login, register, etc.)
  }}
/>
```

**Процесс:**
1. Пользователь вводит email
2. Система запрашивает код через `authApi.forgotPassword()`
3. Код отправляется на email через бекенд
4. На компоненте показывается поле ввода кода
5. После верификации кода - переход на ResetPassword

### ResetPassword Component
**Функция:** Второй шаг - установка нового пароля

```typescript
<ResetPassword 
  email="user@example.com"
  onSuccess={() => {
    // Пароль успешно изменён, перейти на login
  }}
  onSwitchTo={(mode) => {
    // Переключаться между режимами
  }}
/>
```

**Процесс:**
1. Пользователь вводит новый пароль
2. Система проверяет требования к паролю
3. Система отправляет пароль через `authApi.resetPassword()`
4. После успеха - очищаются токены и перенаправление на login

## Session Storage Usage

**Хранящиеся данные:**
```javascript
// Reset token (действителен 30 минут)
sessionStorage.setItem('reset_token', 'jwt_token_here');
sessionStorage.setItem('reset_token_expires', '1693857600000');

// Email для восстановления
sessionStorage.setItem('password_reset_email', 'user@example.com');
sessionStorage.setItem('password_reset_timestamp', '1693857300000');

// Encryption key (для текущей сессии)
sessionStorage.setItem('encryption_key', 'session_key_here');
```

**Очистка:**
```typescript
// Автоматически при успехе
authApi.clearResetTokens();

// При выходе
authApi.logout();
```

## Error Handling

```typescript
try {
  const result = await authApi.forgotPassword(email);
  
  if (result.success) {
    // Успех
  } else {
    // Ошибка от сервера
    console.error(result.error);
    // Обработать: "User not found", "Email invalid", etc.
  }
} catch (error) {
  // Сетевая ошибка
  console.error('Network error:', error);
}
```

## Security Checklist

- ✅ Все пароли шифруются перед отправкой
- ✅ Коды верификации генерируются на бекенде
- ✅ Reset tokens имеют TTL 30 минут
- ✅ Все операции логируются
- ✅ Чувствительные данные удаляются из sessionStorage после использования
- ✅ Email и пароли не хранятся в localStorage
- ✅ Требования к паролю: 8+ символов, заглавные, строчные, цифры, спецсимволы

## Testing

### Тестовые учётные записи:

**Обычный пользователь:**
```
Email: demo@animedia.ru
Пароль: demo123
Новый пароль: TestPassword123!
```

**Администратор:**
```
Email: admin@animedia.ru
Пароль: admin123
Требуется верификация email: Код 123456
```

### Потоки тестирования:

1. **Успешное восстановление пароля**
   - Ввести email → Получить код → Ввести код → Установить пароль → Вход с новым паролем

2. **Неверный код**
   - Ввести email → Ввести неверный код → Получить ошибку

3. **Истёкший код**
   - Ввести email → Ждать > 15 минут → Ввести код → Получить ошибку "Token expired"

4. **Слабый пароль**
   - Установить пароль < 8 символов → Получить ошибку валидации
   - Установить пароль без заглавной буквы → Получить ошибку валидации

## Monitoring & Logging

**События, которые логируются:**
- PASSWORD_RESET_REQUESTED
- PASSWORD_RESET_CODE_VERIFIED
- PASSWORD_RESET_COMPLETED
- PASSWORD_RESET_FAILED
- PASSWORD_RESET_EXPIRED

**Мониторинг через админ-панель:**
```typescript
// Получить статистику
const stats = await adminApi.getDashboardStats();

// Получить последние события безопасности
const events = await adminApi.getRecentSecurityEvents(50);

// Получить неудачные попытки входа
const failedLogins = await adminApi.getFailedLoginAttempts({
  limit: 100
});
```

---

**Дата обновления:** 2026-09-01
**Версия:** 1.0
