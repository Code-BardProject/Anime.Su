import { useEffect } from 'react';

export default function AuthCallback() {
  useEffect(() => {
    // This page handles OAuth callbacks
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    
    if (params.has('access_token')) {
      const token = params.get('access_token');
      const userId = params.get('user_id');
      
      // Send message to parent window with the token
      if (window.opener) {
        if (window.location.href.includes('discord')) {
          window.opener.postMessage(
            { type: 'discord_oauth_token', token },
            window.location.origin
          );
        } else if (window.location.href.includes('vk')) {
          window.opener.postMessage(
            { type: 'vk_oauth_token', token, userId },
            window.location.origin
          );
        }
        window.close();
      } else {
        // Fallback: store token and redirect
        if (token) {
          localStorage.setItem('oauth_token', token);
          if (userId) {
            localStorage.setItem('oauth_user_id', userId);
          }
        }
        window.location.href = '/';
      }
    } else {
      // No token in URL, redirect to home
      window.location.href = '/';
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p style={{ color: '#6b6b8a', fontFamily: 'var(--font-body)' }}>
          Обработка авторизации...
        </p>
      </div>
    </div>
  );
}
