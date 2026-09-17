import { useState, useEffect } from 'react';
import { authApi } from '../../../services/authApi';

export default function DiscordAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for token from popup callback
    const checkToken = setInterval(() => {
      const token = (window as any).discordOAuthToken;
      if (token) {
        clearInterval(checkToken);
        handleDiscordToken(token);
        delete (window as any).discordOAuthToken;
      }
    }, 500);

    return () => clearInterval(checkToken);
  }, []);

  const handleDiscordLogin = () => {
    setIsLoading(true);
    setError(null);

    const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID || 'your_discord_client_id';
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/discord/callback');
    const scope = encodeURIComponent('identify email');
    
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;

    // Open popup for Discord OAuth
    const popup = window.open(
      discordAuthUrl,
      'Discord Auth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    if (!popup) {
      setError('Popup was blocked. Please allow popups for this site.');
      setIsLoading(false);
      return;
    }

    // Check if popup is closed
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setIsLoading(false);
        setError('Authentication was cancelled');
      }
    }, 1000);

    // Cleanup after timeout
    setTimeout(() => {
      clearInterval(checkClosed);
      if (!popup.closed) {
        popup.close();
      }
      setIsLoading(false);
    }, 120000); // 2 minutes timeout
  };

  const handleDiscordToken = async (token: string) => {
    try {
      const authResponse = await authApi.authenticateWithDiscord(token);
      
      if (authResponse.success) {
        console.log('Discord authentication successful:', authResponse.user);
        window.location.reload(); // Reload to update auth state
      } else {
        setError(authResponse.error || 'Authentication failed');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Authentication failed');
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDiscordLogin}
      disabled={isLoading}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded transition-all hover:opacity-80 disabled:opacity-50"
      style={{
        background: 'rgba(88, 101, 242, 0.1)',
        border: '1px solid rgba(88, 101, 242, 0.3)',
        color: '#5865f2',
      }}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      )}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 12,
          letterSpacing: '0.04em',
        }}
      >
        {isLoading ? '...' : 'Discord'}
      </span>
    </button>
  );
}
