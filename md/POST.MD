# AnimeSu API integration

## Frontend environment

Create `.env.local` in the frontend project:

```env
VITE_API_URL=http://localhost:5003/api
```

`VITE_API_URL` is normalized by `services/api.ts`; both `http://localhost:5003` and the full `/api` URL are supported.

## Backend environment

Create `.env` in `C:/Users/admin/Desktop/animesu-backend/`:

```env
PORT=5003
MONGODB_URI=<MongoDB connection string>
JWT_SECRET=<long random JWT secret>
FRONTEND_URL=http://localhost:8443
FRONTEND_URLS=http://localhost:8443,http://127.0.0.1:8443
SMTP_HOST=<SMTP host>
SMTP_PORT=587
SMTP_USER=<SMTP username>
SMTP_PASS=<SMTP password or app password>
SMTP_FROM=Animesu <sender email>
```

`API_KEY` is optional. If configured on the backend, browsers must send the same value as `VITE_API_KEY` in `.env.local`. A browser-exposed Vite key is an access gate, not a secret; JWT authorization and backend role checks remain mandatory.

## Request headers

`services/api.ts` sends:

- `Content-Type: application/json`
- `Authorization: Bearer <JWT>` after login or registration
- `X-API-Key: <VITE_API_KEY>` only when `VITE_API_KEY` is configured

## Auth endpoints

- `POST /api/auth/register` - user registration and email code delivery
- `POST /api/auth/login` - user login
- `POST /api/auth/admin/register` - admin registration and email code delivery
- `POST /api/auth/admin/login` - admin login
- `POST /api/auth/verify-email` - verify a six-character email code
- `POST /api/auth/resend-verification` - resend an email code
- `POST /api/auth/forgot-password` - send password reset code
- `POST /api/auth/verify-reset-code` - validate password reset code
- `POST /api/auth/reset-password` - set a new password

## Anime and uploads endpoints

- `GET /api/admin/anime/public` - public catalog
- `POST /api/admin/anime` - create anime, admin JWT required
- `PUT /api/admin/anime/:id` - update anime, admin JWT required
- `DELETE /api/admin/anime/:id` - delete anime, admin JWT required
- `POST /api/admin/anime/upload-media` - upload media, admin JWT required

Uploaded files are served by the backend from `/uploads/anime/animeimg/` and `/uploads/anime/animevideo/`.

Admin registration sends and stores `username`, `email`, `phone`, `country`, and `password`. The backend requires at least 8 password characters. The country selector stores an ISO-like country code such as `RU`, `UA`, or `DE`.

## Persistent browser state

- `animeSuAuthToken` - JWT session token returned by backend auth
- `animeSuUser` - serialized authenticated user profile used to restore the current session
- `animeSuCurrentPage` - last frontend route
- `animeSuSelectedAnime` - selected catalog item
- `animeSuAdminSection` - selected admin section
- `animeSuLanguage` - selected interface language

Password reset email and reset codes are intentionally not stored in `localStorage`; they remain in the active React flow and are submitted directly to the backend.
