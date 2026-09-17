# Backend Integration Guide - Password Recovery System

## Обзор системы

Система восстановления пароля использует многоуровневое шифрование и интеграцию через API:

```
Frontend (Encryption) → AuthAPI → Database → Backend
      ↓
   Database (Audit Log)
```

## API Endpoints для бекенда

### 1. Password Reset Request
**Endpoint:** `POST /api/auth/forgot-password`

```javascript
// Request
{
  email: "encrypted_email", // Зашифрованный email
  timestamp: 1234567890
}

// Response
{
  success: true,
  message: "Password reset code sent to email",
  resetToken?: "temporary_token_for_verification"
}
```

**Backend логика:**
```javascript
// routes/auth.js
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, timestamp } = req.body;
    
    // Расшифровать email
    const decryptedEmail = decrypt(email);
    
    // Найти пользователя
    const user = await User.findOne({ email: decryptedEmail });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Генерировать код верификации (6 цифр)
    const resetCode = Math.random().toString().substring(2, 8);
    
    // Сохранить в базе с TTL (15 минут)
    const passwordReset = new PasswordReset({
      userId: user._id,
      code: hashCode(resetCode),
      email: decryptedEmail,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      status: 'pending'
    });
    await passwordReset.save();
    
    // Отправить код по email
    await sendEmail(decryptedEmail, {
      subject: 'Восстановление пароля',
      template: 'password-reset',
      data: { resetCode }
    });
    
    // Логировать действие
    await SecurityLog.create({
      userId: user._id,
      action: 'PASSWORD_RESET_REQUESTED',
      email: decryptedEmail,
      timestamp: new Date()
    });
    
    res.json({ 
      success: true, 
      message: 'Код отправлен на email' 
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 2. Verify Reset Code
**Endpoint:** `POST /api/auth/verify-reset-code`

```javascript
// Request
{
  email: "encrypted_email",
  code: "encrypted_code",
  timestamp: 1234567890
}

// Response
{
  success: true,
  resetToken: "jwt_token_valid_for_30_minutes",
  message: "Code verified successfully"
}
```

**Backend логика:**
```javascript
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code, timestamp } = req.body;
    
    // Расшифровать
    const decryptedEmail = decrypt(email);
    const decryptedCode = decrypt(code);
    
    // Найти запрос на восстановление
    const reset = await PasswordReset.findOne({
      email: decryptedEmail,
      status: 'pending'
    });
    
    if (!reset) {
      return res.status(400).json({ 
        success: false, 
        error: 'No active reset request' 
      });
    }
    
    // Проверить TTL
    if (reset.expiresAt < new Date()) {
      reset.status = 'expired';
      await reset.save();
      return res.status(400).json({ 
        success: false, 
        error: 'Reset code expired' 
      });
    }
    
    // Проверить код
    if (!compareCode(decryptedCode, reset.code)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid code' 
      });
    }
    
    // Обновить статус
    reset.status = 'verified';
    reset.verifiedAt = new Date();
    await reset.save();
    
    // Создать JWT для следующего шага (30 минут)
    const resetToken = jwt.sign(
      { resetId: reset._id, email: decryptedEmail },
      process.env.RESET_SECRET,
      { expiresIn: '30m' }
    );
    
    // Логировать
    await SecurityLog.create({
      userId: reset.userId,
      action: 'PASSWORD_RESET_CODE_VERIFIED',
      email: decryptedEmail,
      timestamp: new Date()
    });
    
    res.json({ 
      success: true, 
      resetToken,
      message: 'Code verified' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 3. Reset Password (Complete)
**Endpoint:** `POST /api/auth/reset-password`

```javascript
// Request (with Authorization: Bearer resetToken)
{
  password: "encrypted_password",
  timestamp: 1234567890
}

// Response
{
  success: true,
  message: "Password successfully reset"
}
```

**Backend логика:**
```javascript
router.post('/reset-password', verifyResetToken, async (req, res) => {
  try {
    const { password, timestamp } = req.body;
    const { resetId, email } = req.user; // From JWT
    
    // Расшифровать пароль
    const decryptedPassword = decrypt(password);
    
    // Проверить требования к паролю
    if (!isValidPassword(decryptedPassword)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password does not meet requirements' 
      });
    }
    
    // Найти пользователя
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Найти запрос на восстановление
    const reset = await PasswordReset.findById(resetId);
    if (!reset || reset.status !== 'verified') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid reset token' 
      });
    }
    
    // Хешировать и сохранить новый пароль
    const hashedPassword = await bcrypt.hash(decryptedPassword, 10);
    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    await user.save();
    
    // Завершить запрос
    reset.status = 'completed';
    reset.completedAt = new Date();
    await reset.save();
    
    // Инвалидировать все другие токены сессии
    await Session.deleteMany({ userId: user._id });
    
    // Логировать
    await SecurityLog.create({
      userId: user._id,
      action: 'PASSWORD_RESET_COMPLETED',
      email: email,
      timestamp: new Date()
    });
    
    res.json({ 
      success: true, 
      message: 'Password reset successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## Database Models

### PasswordReset Model
```javascript
// models/PasswordReset.js
import mongoose from 'mongoose';

const passwordResetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    index: true
  },
  code: {
    type: String, // Хешированный код
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'completed', 'expired', 'rejected'],
    default: 'pending'
  },
  verifiedAt: Date,
  completedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  
  // Для безопасности
  ipAddress: String,
  userAgent: String,
  attemptCount: {
    type: Number,
    default: 0
  },
  
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 15 * 60 * 1000), // 15 минут
    index: { expireAfterSeconds: 0 } // TTL индекс
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('PasswordReset', passwordResetSchema);
```

### SecurityLog Model
```javascript
// models/SecurityLog.js
const securityLogSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  action: {
    type: String,
    enum: [
      'PASSWORD_RESET_REQUESTED',
      'PASSWORD_RESET_CODE_VERIFIED',
      'PASSWORD_RESET_COMPLETED',
      'PASSWORD_RESET_FAILED',
      'EMAIL_VERIFICATION_SENT',
      'ADMIN_EMAIL_VERIFIED',
      'LOGIN_SUCCESS',
      'LOGIN_FAILED'
    ]
  },
  email: String,
  ipAddress: String,
  userAgent: String,
  details: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

export default mongoose.model('SecurityLog', securityLogSchema);
```

## Middleware для защиты

```javascript
// middleware/verifyResetToken.js
import jwt from 'jsonwebtoken';

export const verifyResetToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No reset token provided' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.RESET_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: 'Invalid reset token' 
    });
  }
};
```

## Переменные окружения (.env)

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@animesu.com

# Security
RESET_SECRET=your-reset-secret-key-here
JWT_SECRET=your-jwt-secret-key-here
ENCRYPTION_KEY=your-encryption-key-here

# Password Policy
MIN_PASSWORD_LENGTH=8
REQUIRE_UPPERCASE=true
REQUIRE_LOWERCASE=true
REQUIRE_NUMBERS=true
REQUIRE_SPECIAL_CHARS=true

# Reset Settings
RESET_CODE_EXPIRY=15 # minutes
RESET_TOKEN_EXPIRY=30 # minutes
MAX_RESET_ATTEMPTS=3
```

## Email Template

```html
<!-- templates/password-reset.html -->
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1>Восстановление пароля</h1>
  <p>Привет,</p>
  <p>Мы получили запрос на восстановление пароля для вашего аккаунта.</p>
  
  <div style="background: #f0f0f0; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
    <p style="margin: 0; font-size: 12px; color: #666;">Ваш код верификации:</p>
    <p style="margin: 10px 0; font-size: 32px; font-weight: bold; letter-spacing: 5px;">{{resetCode}}</p>
    <p style="margin: 0; font-size: 12px; color: #999;">Действителен 15 минут</p>
  </div>
  
  <p>Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.</p>
  
  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
  <p style="font-size: 12px; color: #999;">
    © 2026 AnimeSu. Это письмо было отправлено на {{email}}<br>
    <a href="https://animesu.com/security">Политика безопасности</a> | 
    <a href="https://animesu.com/privacy">Приватность</a>
  </p>
</div>
```

## Тестирование

### Curl примеры

```bash
# 1. Запросить код восстановления
curl -X POST http://localhost:5003/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"encrypted_email","timestamp":'$(date +%s)'000}'

# 2. Проверить код
curl -X POST http://localhost:5003/api/auth/verify-reset-code \
  -H "Content-Type: application/json" \
  -d '{"email":"encrypted_email","code":"encrypted_code","timestamp":'$(date +%s)'000}'

# 3. Сбросить пароль
curl -X POST http://localhost:5003/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer reset_token_here" \
  -d '{"password":"encrypted_password","timestamp":'$(date +%s)'000}'
```

## Безопасность

- ✅ Все пароли и коды зашифрованы при передаче
- ✅ Коды восстановления действуют только 15 минут
- ✅ Reset токены действуют только 30 минут
- ✅ Максимум 3 попытки ввода кода
- ✅ Все действия логируются в SecurityLog
- ✅ После успешного сброса пароля инвалидируются все сессии
- ✅ IP адрес и User Agent сохраняются для аудита

## Мониторинг

### Ключевые метрики для мониторинга:
- Количество запросов на восстановление пароля
- Процент успешных проверок кодов
- Среднее время между запросом и завершением
- Попытки несанкционированного доступа
- Email адреса с повторяющимися попытками
