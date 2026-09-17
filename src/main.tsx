import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './i18n/in8n'
import './index.css'

// Handle OAuth callback messages from popup windows
if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;
    
    // Handle Discord OAuth callback
    if (event.data.type === 'discord_oauth_token') {
      // Store token temporarily for the auth component to pick up
      (window as any).discordOAuthToken = event.data.token;
    }
    
    // Handle VK OAuth callback
    if (event.data.type === 'vk_oauth_token') {
      (window as any).vkOAuthToken = event.data.token;
      (window as any).vkOAuthUserId = event.data.userId;
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>,
)
