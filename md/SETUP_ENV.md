# Environment Setup Instructions

## Frontend (.env.local)

Create a `.env.local` file in the AnimeSu frontend directory with the following content:

```env
# Backend API URL
VITE_API_URL=http://localhost:5003

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# Discord OAuth
VITE_DISCORD_CLIENT_ID=your_discord_client_id_here

# VK OAuth
VITE_VK_CLIENT_ID=your_vk_client_id_here
```

## Backend (.env)

The backend `.env` file is already configured in `animesu-backend/.env`. You need to update the OAuth credentials:

```env
# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8443/auth/google/callback

DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:8443/auth/discord/callback

VK_CLIENT_ID=your_vk_client_id
VK_CLIENT_SECRET=your_vk_client_secret
VK_REDIRECT_URI=http://localhost:8443/auth/vk/callback

# JWT Secret
JWT_SECRET=animesu-jwt-secret-key-change-in-production

# Frontend URL
FRONTEND_URL=http://localhost:8443
```

## Getting OAuth Credentials

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:8443/auth/google/callback`
6. Copy Client ID and Client Secret

### Discord OAuth
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 tab
4. Add redirect URI: `http://localhost:8443/auth/discord/callback`
5. Copy Client ID and Client Secret

### VK OAuth
1. Go to [VK Developers](https://vk.com/dev)
2. Create a new application
3. Set up OAuth settings
4. Add redirect URI: `http://localhost:8443/auth/vk/callback`
5. Copy Client ID and Client Secret

## Installation

### Backend
```bash
cd animesu-backend
npm install
npm run dev
```

### Frontend
```bash
cd AnimeSu
npm install
npm run dev
```

The backend will run on port 5003 and frontend on port 8443.
